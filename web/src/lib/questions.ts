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
};

type ApiQuestion = {
  id: string;
  question: string;
  answer: string;
  subject: string;
  unit: string;
  difficulty: Difficulty;
  created_at: string;
  updated_at: string;
};

const API_URL = "http://localhost:4000";

function normalizeQuestion(q: ApiQuestion): Question {
  return {
    id: q.id,
    question: q.question,
    answer: q.answer,
    subject: q.subject,
    unit: q.unit,
    difficulty: q.difficulty,
    dueAt: null,
    completed: false,
  };
}

export async function getQuestions(): Promise<Question[]> {
  const response = await fetch(
    `${API_URL}/questions`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load questions: ${response.status}`
    );
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    console.error("Unexpected /questions response:", data);
    throw new Error(
      "API /questions did not return an array"
    );
  }

  return data.map(normalizeQuestion);
}

export async function getQuestion(
  id: string
): Promise<Question | null> {
  const response = await fetch(
    `${API_URL}/questions/${id}`,
    {
      cache: "no-store",
    }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to load question");
  }

  const data: ApiQuestion =
    await response.json();

  return normalizeQuestion(data);
}

export async function addQuestion(
  question: string,
  answer: string,
  subject: string,
  unit: string,
  difficulty: Difficulty,
  _dueAt: string | null
): Promise<Question> {
  const response = await fetch(
    `${API_URL}/questions`,
    {
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
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Failed to add question: ${text}`
    );
  }

  const data: ApiQuestion =
    await response.json();

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

  const response = await fetch(
    `${API_URL}/questions/${id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question:
          changes.question ?? current.question,
        answer:
          changes.answer ?? current.answer,
        subject:
          changes.subject ?? current.subject,
        unit:
          changes.unit ?? current.unit,
        difficulty:
          changes.difficulty ?? current.difficulty,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update question");
  }

  const data: ApiQuestion =
    await response.json();

  return normalizeQuestion(data);
}

export async function deleteQuestion(
  id: string
): Promise<void> {
  const response = await fetch(
    `${API_URL}/questions/${id}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok && response.status !== 404) {
    throw new Error("Failed to delete question");
  }
}

export async function getUnlockedDifficulty(
  questions: Question[],
  subject: string,
  unit: string
): Promise<Difficulty> {
  const unitQuestions = questions.filter(
    (q) =>
      q.subject === subject &&
      q.unit === unit
  );

  for (const difficulty of [
    "Easy",
    "Intermediate",
    "Advanced",
  ] as Difficulty[]) {
    if (
      unitQuestions.some(
        (q) => q.difficulty === difficulty
      )
    ) {
      return difficulty;
    }
  }

  return "Easy";
}

export function difficultyNumber(
  difficulty: Difficulty
): number {
  return [
    "Easy",
    "Intermediate",
    "Advanced",
  ].indexOf(difficulty);
}



