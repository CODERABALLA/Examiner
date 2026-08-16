import { Elysia } from "elysia";
import postgres from "postgres";

const sql = postgres({
  host: "localhost",
  port: 5433,
  database: "examiner",
  username: "examiner",
  password: "examiner_dev_password",
});

const app = new Elysia()
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

  .listen(4000);

console.log(
  `🦊 Examiner API running at http://${app.server?.hostname}:${app.server?.port}`
);