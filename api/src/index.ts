import "dotenv/config";
import { Elysia } from "elysia";
import cors from "@elysiajs/cors";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing from api/.env");
}

const sql = postgres(databaseUrl);

const QUESTION_COLUMNS = `
  id,
  question,
  answer,
  subject,
  unit,
  difficulty,
  completed,
  due_at,
  sort_order,
  created_at,
  updated_at
`;

type Body = {
  question?: string;
  answer?: string;
  subject?: string;
  unit?: string;
  difficulty?: "Easy" | "Intermediate" | "Advanced";
  dueAt?: string | null;
  completed?: boolean;
};

function validateRequired(data: Body): string | null {
  if (
    !data.question?.trim() ||
    !data.answer?.trim() ||
    !data.subject?.trim() ||
    !data.unit?.trim() ||
    !data.difficulty
  ) {
    return "All question fields are required";
  }
  return null;
}

const app = new Elysia()
  .use(cors({ origin: (process.env.CORS_ORIGIN || "http://localhost:3000").split(","), credentials: false }))

  .get("/", () => ({
    message: "Examiner API is running",
  }))

  .get("/health", async () => {
    try {
      await sql`SELECT 1`;

      return {
        status: "ok",
        database: "connected",
      };
    } catch (error) {
      console.error(error);

      return {
        status: "error",
        database: "disconnected",
      };
    }
  })

  .get("/questions", async () => {
    return await sql`
      SELECT
        ${sql.unsafe(QUESTION_COLUMNS)}
      FROM questions
      ORDER BY subject ASC, unit ASC, difficulty ASC, sort_order ASC, created_at ASC
    `;
  })

  .get("/questions/:id", async ({ params, set }) => {
    const rows = await sql`
      SELECT
        ${sql.unsafe(QUESTION_COLUMNS)}
      FROM questions
      WHERE id = ${params.id}
      LIMIT 1
    `;

    if (rows.length === 0) {
      set.status = 404;
      return { error: "Question not found" };
    }

    return rows[0];
  })

  .post("/questions", async ({ body, set }) => {
    const data = body as Body;

    const validationError = validateRequired(data);
    if (validationError) {
      set.status = 400;
      return { error: validationError };
    }

    const nextOrder = await sql`
      SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order
      FROM questions
      WHERE subject = ${data.subject!.trim()}
        AND unit = ${data.unit!.trim()}
    `;
    const sortOrder = Number(nextOrder[0]?.next_order ?? 0);

    const dueAt = data.dueAt ? new Date(data.dueAt) : undefined;

    const rows = await sql`
      INSERT INTO questions (
        question,
        answer,
        subject,
        unit,
        difficulty,
        completed,
        due_at,
        sort_order
      )
      VALUES (
        ${data.question!.trim()},
        ${data.answer!.trim()},
        ${data.subject!.trim()},
        ${data.unit!.trim()},
        ${data.difficulty!},
        false,
        ${dueAt ?? null},
        ${sortOrder}
      )
      RETURNING
        ${sql.unsafe(QUESTION_COLUMNS)}
    `;

    set.status = 201;

    return rows[0];
  })

  .put("/questions/:id", async ({ params, body, set }) => {
    const data = body as Body;

    const validationError = validateRequired(data);
    if (validationError) {
      set.status = 400;
      return { error: validationError };
    }

    const existing = await sql`
      SELECT completed, due_at
      FROM questions
      WHERE id = ${params.id}
      LIMIT 1
    `;

    const current = existing[0];

    if (!current) {
      set.status = 404;
      return { error: "Question not found" };
    }

    const completed = data.completed ?? current.completed;
    const dueAt =
      data.dueAt === undefined
        ? current.due_at
        : data.dueAt
          ? new Date(data.dueAt)
          : null;

    const rows = await sql`
      UPDATE questions
      SET
        question = ${data.question!.trim()},
        answer = ${data.answer!.trim()},
        subject = ${data.subject!.trim()},
        unit = ${data.unit!.trim()},
        difficulty = ${data.difficulty!},
        completed = ${completed},
        due_at = ${dueAt}
      WHERE id = ${params.id}
      RETURNING
        ${sql.unsafe(QUESTION_COLUMNS)}
    `;

    return rows[0];
  })

  .delete("/questions/:id", async ({ params, set }) => {
    const rows = await sql`
      DELETE FROM questions
      WHERE id = ${params.id}
      RETURNING id
    `;

    if (rows.length === 0) {
      set.status = 404;
      return { error: "Question not found" };
    }

    return { success: true };
  })

  .listen({
    hostname: "0.0.0.0",
    port: Number(process.env.PORT) || 4000,
  });

console.log(
  `Examiner API running on port ${app.server?.port}`
);
