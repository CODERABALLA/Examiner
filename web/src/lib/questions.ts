export type Difficulty = "Easy" | "Intermediate" | "Advanced";

export const DIFFICULTIES: Difficulty[] = [
  "Easy",
  "Intermediate",
  "Advanced",
];

export type Question = {
  id: string;
  question: string;
  answer: string;
  subject: string;
  unit: string;
  difficulty: Difficulty;
  dueAt: string | null;
  completed: boolean;
  createdAt: string;
};

const STORAGE_KEY = "examiner_questions";

function normalizeQuestion(raw: any): Question {
  let subject = raw.subject || "General";
  let unit = raw.unit || "";

  // Migrate the old format:
  // "English — Unit I — Netiquette"
  if (!raw.unit && typeof raw.subject === "string") {
    const parts = raw.subject
      .split("—")
      .map((part: string) => part.trim())
      .filter(Boolean);

    if (parts.length >= 2) {
      subject = parts[0];
      unit = parts.slice(1).join(" — ");
    }
  }

  const difficulty: Difficulty =
    raw.difficulty === "Intermediate" || raw.difficulty === "Advanced"
      ? raw.difficulty
      : "Easy";

  return {
    id: raw.id || crypto.randomUUID(),
    question: raw.question || "",
    answer: raw.answer || "",
    subject,
    unit: unit || "General",
    difficulty,
    // Old questions were automatically due. We don't want that anymore.
    dueAt: raw.unit ? raw.dueAt ?? null : null,
    completed: Boolean(raw.completed),
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

export function getQuestions(): Question[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

    const normalized = Array.isArray(raw)
      ? raw.map(normalizeQuestion)
      : [];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));

    return normalized;
  } catch {
    return [];
  }
}

export function saveQuestions(questions: Question[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
}

export function addQuestion(
  question: string,
  answer: string,
  subject: string,
  unit: string,
  difficulty: Difficulty,
  dueAt: string | null
): Question {
  const questions = getQuestions();

  const newQuestion: Question = {
    id: crypto.randomUUID(),
    question,
    answer,
    subject: subject.trim() || "General",
    unit: unit.trim() || "General",
    difficulty,
    dueAt,
    completed: false,
    createdAt: new Date().toISOString(),
  };

  saveQuestions([...questions, newQuestion]);

  return newQuestion;
}

export function updateQuestion(
  id: string,
  changes: Partial<Question>
) {
  const questions = getQuestions().map((q) =>
    q.id === id ? { ...q, ...changes } : q
  );

  saveQuestions(questions);
}

export function deleteQuestion(id: string) {
  const questions = getQuestions().filter((q) => q.id !== id);
  saveQuestions(questions);
}

export function clearQuestions() {
  saveQuestions([]);
}

export function getQuestion(id: string) {
  return getQuestions().find((q) => q.id === id);
}

export function getUnlockedDifficulty(
  questions: Question[],
  subject: string,
  unit: string
): Difficulty {
  const unitQuestions = questions.filter(
    (q) => q.subject === subject && q.unit === unit
  );

  for (const difficulty of DIFFICULTIES) {
    const levelQuestions = unitQuestions.filter(
      (q) => q.difficulty === difficulty
    );

    if (levelQuestions.length === 0) continue;

    const finished = levelQuestions.every((q) => q.completed);

    if (!finished) return difficulty;
  }

  return "Advanced";
}

export function difficultyNumber(
  difficulty: Difficulty
): number {
  return DIFFICULTIES.indexOf(difficulty);
}