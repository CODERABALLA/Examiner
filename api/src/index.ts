import "dotenv/config";
import { Elysia } from "elysia";
import cors from "@elysiajs/cors";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing from api/.env");
}

const sql = postgres(databaseUrl);

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
        id,
        question,
        answer,
        subject,
        unit,
        difficulty,
        created_at,
        updated_at
      FROM questions
      ORDER BY created_at ASC
    `;
  })

  .get("/questions/:id", async ({ params, set }) => {
    const rows = await sql`
      SELECT
        id,
        question,
        answer,
        subject,
        unit,
        difficulty,
        created_at,
        updated_at
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
    const data = body as {
      question?: string;
      answer?: string;
      subject?: string;
      unit?: string;
      difficulty?: "Easy" | "Intermediate" | "Advanced";
    };

    if (
      !data.question?.trim() ||
      !data.answer?.trim() ||
      !data.subject?.trim() ||
      !data.unit?.trim() ||
      !data.difficulty
    ) {
      set.status = 400;
      return { error: "All question fields are required" };
    }

    const rows = await sql`
      INSERT INTO questions (
        question,
        answer,
        subject,
        unit,
        difficulty
      )
      VALUES (
        ${data.question.trim()},
        ${data.answer.trim()},
        ${data.subject.trim()},
        ${data.unit.trim()},
        ${data.difficulty}
      )
      RETURNING
        id,
        question,
        answer,
        subject,
        unit,
        difficulty,
        created_at,
        updated_at
    `;

    set.status = 201;

    return rows[0];
  })

  .put("/questions/:id", async ({ params, body, set }) => {
    const data = body as {
      question?: string;
      answer?: string;
      subject?: string;
      unit?: string;
      difficulty?: "Easy" | "Intermediate" | "Advanced";
    };

    if (
      !data.question?.trim() ||
      !data.answer?.trim() ||
      !data.subject?.trim() ||
      !data.unit?.trim() ||
      !data.difficulty
    ) {
      set.status = 400;
      return { error: "All question fields are required" };
    }

    const rows = await sql`
      UPDATE questions
      SET
        question = ${data.question.trim()},
        answer = ${data.answer.trim()},
        subject = ${data.subject.trim()},
        unit = ${data.unit.trim()},
        difficulty = ${data.difficulty}
      WHERE id = ${params.id}
      RETURNING
        id,
        question,
        answer,
        subject,
        unit,
        difficulty,
        created_at,
        updated_at
    `;

    if (rows.length === 0) {
      set.status = 404;
      return { error: "Question not found" };
    }

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

