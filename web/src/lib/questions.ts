export type Difficulty =
  | "Easy"
  | "Intermediate"
  | "Advanced";

export type Question = {
  id: string;
  question: string;
  answer: string;
  subject: string;
  unit: string;
  difficulty: Difficulty;
  dueAt: string | null;
  completed: boolean;
  sortOrder: number;
};

type ApiQuestion = {
  id: string;
  question: string;
  answer: string;
  subject: string;
  unit: string;
  difficulty: Difficulty;
  completed: boolean;
  due_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export const DIFFICULTY_ORDER: Difficulty[] = [
  "Easy",
  "Intermediate",
  "Advanced",
];

export function isMathematicsSubject(subject: string): boolean {
  if (!subject) return false;
  const s = subject.toLowerCase().trim();
  return s === "math" || s === "maths" || s.includes("mathematic");
}

const API_URL = "/api";

function normalizeQuestion(q: ApiQuestion): Question {
  return {
    id: q.id,
    question: q.question,
    answer: q.answer,
    subject: q.subject,
    unit: q.unit,
    difficulty: q.difficulty,
    dueAt: q.due_at ?? null,
    completed: q.completed,
    sortOrder: q.sort_order,
  };
}

export async function getQuestions(): Promise<Question[]> {
  const response = await fetch(`${API_URL}/questions`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load questions: ${response.status}`);
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    console.error("Unexpected /questions response:", data);
    throw new Error("API /questions did not return an array");
  }

  return data.map(normalizeQuestion);
}

export async function getQuestion(id: string): Promise<Question | null> {
  const response = await fetch(`${API_URL}/questions/${id}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to load question");
  }

  const data: ApiQuestion = await response.json();
  return normalizeQuestion(data);
}

export async function addQuestion(
  question: string,
  answer: string,
  subject: string,
  unit: string,
  difficulty: Difficulty,
  dueAt: string | null
): Promise<Question> {
  const response = await fetch(`${API_URL}/questions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question,
      answer,
      subject,
      unit,
      difficulty,
      dueAt,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to add question: ${text}`);
  }

  const data: ApiQuestion = await response.json();
  return normalizeQuestion(data);
}

export async function updateQuestion(
  id: string,
  changes: Partial<Question>
): Promise<Question> {
  const current = await getQuestion(id);

  if (!current) {
    throw new Error("Question not found");
  }

  const response = await fetch(`${API_URL}/questions/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question: changes.question ?? current.question,
      answer: changes.answer ?? current.answer,
      subject: changes.subject ?? current.subject,
      unit: changes.unit ?? current.unit,
      difficulty: changes.difficulty ?? current.difficulty,
      dueAt: changes.dueAt === undefined ? current.dueAt : changes.dueAt,
      completed: changes.completed ?? current.completed,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to update question");
  }

  const data: ApiQuestion = await response.json();
  return normalizeQuestion(data);
}

export async function deleteQuestion(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/questions/${id}`, {
    method: "DELETE",
  });

  if (!response.ok && response.status !== 404) {
    throw new Error("Failed to delete question");
  }
}

// ---------------------------------------------------------------
// Study progression logic
// ---------------------------------------------------------------

export function getUnitQuestions(
  questions: Question[],
  subject: string,
  unit: string
): Question[] {
  return questions
    .filter((q) => q.subject === subject && q.unit === unit)
    .sort(
      (a, b) =>
        DIFFICULTY_ORDER.indexOf(a.difficulty) -
          DIFFICULTY_ORDER.indexOf(b.difficulty) ||
        a.sortOrder - b.sortOrder ||
        a.id.localeCompare(b.id)
    );
}

// Deterministic ordering used for Previous/Next navigation: difficulty
// progression first, then the stable per-question sort order.
export function getOrderedUnitQuestions(
  questions: Question[],
  subject: string,
  unit: string
): Question[] {
  return getUnitQuestions(questions, subject, unit);
}

// The question that immediately precedes `currentId` in the study order of the
// selected unit, so the student can step back through what they just studied.
export function getPrevStudyQuestion(
  questions: Question[],
  subject: string,
  unit: string,
  currentId: string
): Question | null {
  const ordered = getOrderedUnitQuestions(questions, subject, unit);
  const index = ordered.findIndex((q) => q.id === currentId);
  return index > 0 ? ordered[index - 1] : null;
}

// The next question the student may move to. It only advances past the current
// difficulty once that difficulty is fully complete, and it refuses to step
// into a difficulty that is still locked (previous difficulty incomplete).
export function getNextNavigableQuestion(
  questions: Question[],
  subject: string,
  unit: string,
  currentId: string
): Question | null {
  const ordered = getOrderedUnitQuestions(questions, subject, unit);
  const index = ordered.findIndex((q) => q.id === currentId);
  if (index < 0) return null;

  for (let j = index + 1; j < ordered.length; j++) {
    const candidate = ordered[j];
    if (isDifficultyUnlocked(ordered, candidate.difficulty)) {
      return candidate;
    }
  }
  return null;
}

export function isDifficultyComplete(
  unitQuestions: Question[],
  difficulty: Difficulty
): boolean {
  const level = unitQuestions.filter((q) => q.difficulty === difficulty);
  if (level.length === 0) return true;
  return level.every((q) => q.completed);
}

// A difficulty is unlocked when the previous difficulty in the progression
// has been fully completed (Easy needs no prerequisite but needs questions).
export function isDifficultyUnlocked(
  unitQuestions: Question[],
  difficulty: Difficulty
): boolean {
  const idx = DIFFICULTY_ORDER.indexOf(difficulty);
  if (idx === 0) {
    return unitQuestions.some((q) => q.difficulty === "Easy");
  }
  const previous = DIFFICULTY_ORDER[idx - 1];
  if (!isDifficultyComplete(unitQuestions, previous)) return false;
  return unitQuestions.some((q) => q.difficulty === difficulty);
}

// Highest difficulty that is currently unlocked and has questions.
export function getUnlockedDifficulty(
  questions: Question[],
  subject: string,
  unit: string
): Difficulty {
  const unitQuestions = getUnitQuestions(questions, subject, unit);
  let unlocked: Difficulty = "Easy";
  for (const difficulty of DIFFICULTY_ORDER) {
    if (
      isDifficultyUnlocked(unitQuestions, difficulty) &&
      unitQuestions.some((q) => q.difficulty === difficulty)
    ) {
      unlocked = difficulty;
    }
  }
  return unitQuestions.length ? unlocked : "Easy";
}

// First incomplete question following the Easy -> Intermediate -> Advanced
// progression, or null when the whole unit is complete.
export function findStartQuestion(
  questions: Question[],
  subject: string,
  unit: string
): Question | null {
  const unitQuestions = getUnitQuestions(questions, subject, unit);
  for (const difficulty of DIFFICULTY_ORDER) {
    if (!isDifficultyUnlocked(unitQuestions, difficulty)) continue;
    const incomplete = unitQuestions.filter(
      (q) => q.difficulty === difficulty && !q.completed
    );
    if (incomplete.length > 0) return incomplete[0];
  }
  return null;
}

// The difficulty the student should currently be working on (the first
// unlocked difficulty that has an incomplete question), or null if complete.
export function getCurrentStudyDifficulty(
  questions: Question[],
  subject: string,
  unit: string
): Difficulty | null {
  const unitQuestions = getUnitQuestions(questions, subject, unit);
  for (const difficulty of DIFFICULTY_ORDER) {
    if (!isDifficultyUnlocked(unitQuestions, difficulty)) continue;
    const hasIncomplete = unitQuestions.some(
      (q) => q.difficulty === difficulty && !q.completed
    );
    if (hasIncomplete) return difficulty;
  }
  return null;
}

export function getUnitStats(
  questions: Question[],
  subject: string,
  unit: string
): { total: number; completed: number } {
  const unitQuestions = getUnitQuestions(questions, subject, unit);
  return {
    total: unitQuestions.length,
    completed: unitQuestions.filter((q) => q.completed).length,
  };
}

export function difficultyNumber(difficulty: Difficulty): number {
  return DIFFICULTY_ORDER.indexOf(difficulty);
}
