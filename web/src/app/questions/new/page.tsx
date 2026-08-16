"use client";

import Link from "next/link";
import { useState } from "react";
import {
  addQuestion,
  type Difficulty,
} from "@/lib/questions";
import { useRouter } from "next/navigation";

export default function NewQuestionPage() {
  const [mode, setMode] = useState<"choice" | "individual" | "bulk">(
    "choice"
  );

  if (mode === "individual") {
    return <IndividualForm onBack={() => setMode("choice")} />;
  }

  if (mode === "bulk") {
    return <BulkForm onBack={() => setMode("choice")} />;
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <Link
          href="/questions"
          className="text-sm font-medium text-slate-600"
        >
          ← Questions
        </Link>

        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          Add questions
        </h1>

        <p className="mt-2 text-slate-600">
          Choose how you want to add your questions.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <button
            onClick={() => setMode("individual")}
            className="rounded-2xl border border-slate-200 bg-white p-8 text-left shadow-sm hover:border-indigo-400 hover:shadow-md"
          >
            <p className="text-3xl">✏️</p>
            <h2 className="mt-4 text-xl font-bold">
              Add one question
            </h2>
            <p className="mt-2 text-slate-500">
              Add one question, answer, difficulty and due time.
            </p>
          </button>

          <button
            onClick={() => setMode("bulk")}
            className="rounded-2xl border border-slate-200 bg-white p-8 text-left shadow-sm hover:border-indigo-400 hover:shadow-md"
          >
            <p className="text-3xl">📚</p>
            <h2 className="mt-4 text-xl font-bold">
              Add multiple questions
            </h2>
            <p className="mt-2 text-slate-500">
              Paste many Q1 / Answer pairs at once.
            </p>
          </button>
        </div>
      </div>
    </main>
  );
}

function Fields({
  subject,
  setSubject,
  unit,
  setUnit,
  difficulty,
  setDifficulty,
  dueAt,
  setDueAt,
}: any) {
  return (
    <>
      <label className="block font-semibold">Subject</label>
      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-300 p-3"
        placeholder="e.g. English"
        required
      />

      <label className="mt-5 block font-semibold">
        Unit / Chapter
      </label>
      <input
        value={unit}
        onChange={(e) => setUnit(e.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-300 p-3"
        placeholder="e.g. Unit I — Netiquette"
        required
      />

      <label className="mt-5 block font-semibold">
        Difficulty
      </label>
      <select
        value={difficulty}
        onChange={(e) =>
          setDifficulty(e.target.value as Difficulty)
        }
        className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3"
      >
        <option>Easy</option>
        <option>Intermediate</option>
        <option>Advanced</option>
      </select>

      <label className="mt-5 block font-semibold">
        Due date and time
      </label>
      <input
        type="datetime-local"
        value={dueAt}
        onChange={(e) => setDueAt(e.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-300 p-3"
      />
    </>
  );
}

function IndividualForm({ onBack }: { onBack: () => void }) {
  const router = useRouter();

  const [subject, setSubject] = useState("");
  const [unit, setUnit] = useState("");
  const [difficulty, setDifficulty] =
    useState<Difficulty>("Easy");
  const [dueAt, setDueAt] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();

    addQuestion(
      question,
      answer,
      subject,
      unit,
      difficulty,
      dueAt ? new Date(dueAt).toISOString() : null
    );

    router.push("/questions");
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <button
          onClick={onBack}
          className="text-sm font-medium text-slate-600"
        >
          ← Add question
        </button>

        <h1 className="mt-3 text-3xl font-bold">
          Add one question
        </h1>

        <form
          onSubmit={submit}
          className="mt-8 rounded-2xl bg-white p-6 shadow-sm"
        >
          <Fields
            {...{
              subject,
              setSubject,
              unit,
              setUnit,
              difficulty,
              setDifficulty,
              dueAt,
              setDueAt,
            }}
          />

          <label className="mt-5 block font-semibold">
            Question
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={5}
            className="mt-2 w-full rounded-xl border border-slate-300 p-3"
            required
          />

          <label className="mt-5 block font-semibold">
            Answer
          </label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={8}
            className="mt-2 w-full rounded-xl border border-slate-300 p-3"
            required
          />

          <button className="mt-6 w-full rounded-xl bg-indigo-600 py-4 font-bold text-white">
            Save question
          </button>
        </form>
      </div>
    </main>
  );
}

function BulkForm({ onBack }: { onBack: () => void }) {
  const router = useRouter();

  const [subject, setSubject] = useState("");
  const [unit, setUnit] = useState("");
  const [difficulty, setDifficulty] =
    useState<Difficulty>("Easy");
  const [dueAt, setDueAt] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [error, setError] = useState("");

  function parseQuestions(text: string) {
    const normalized = text.replace(/\r/g, "");

    const regex =
      /(?:^|\n)\s*(?:\*\*)?Q\d+\s*:\s*(?:\*\*)?(.*?)(?:\*\*)?\s*\n\s*(?:\*\*)?Answer\s*:\s*(?:\*\*)?/gi;

    const matches = [...normalized.matchAll(regex)];

    return matches
      .map((match, i) => {
        const question = match[1].trim();

        const start =
          (match.index ?? 0) + match[0].length;

        const end =
          i + 1 < matches.length
            ? matches[i + 1].index ?? normalized.length
            : normalized.length;

        const answer = normalized
          .slice(start, end)
          .replace(/^\s+|\s+$/g, "")
          .replace(/^---+\s*$/gm, "")
          .trim();

        return { question, answer };
      })
      .filter((x) => x.question && x.answer);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = parseQuestions(bulkText);

    if (!parsed.length) {
      setError("No questions were detected.");
      return;
    }

    const isoDue = dueAt
      ? new Date(dueAt).toISOString()
      : null;

    for (const item of parsed) {
      addQuestion(
        item.question,
        item.answer,
        subject,
        unit,
        difficulty,
        isoDue
      );
    }

    router.push("/questions");
  }

  const count = parseQuestions(bulkText).length;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <button
          onClick={onBack}
          className="text-sm font-medium text-slate-600"
        >
          ← Add question
        </button>

        <h1 className="mt-3 text-3xl font-bold">
          Add multiple questions
        </h1>

        <form
          onSubmit={submit}
          className="mt-8 rounded-2xl bg-white p-6 shadow-sm"
        >
          <Fields
            {...{
              subject,
              setSubject,
              unit,
              setUnit,
              difficulty,
              setDifficulty,
              dueAt,
              setDueAt,
            }}
          />

          <label className="mt-5 block font-semibold">
            Questions and answers
          </label>

          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={20}
            placeholder={`Q1: What is netiquette?

Answer: Netiquette is...

Q2: Why is it important?

Answer: Because...`}
            className="mt-2 w-full rounded-xl border border-slate-300 p-4"
            required
          />

          <p className="mt-3 rounded-xl bg-indigo-50 p-4 font-semibold text-indigo-700">
            {count} question{count === 1 ? "" : "s"} detected
          </p>

          {error && (
            <p className="mt-3 rounded-xl bg-red-50 p-4 text-red-700">
              {error}
            </p>
          )}

          <button className="mt-6 w-full rounded-xl bg-indigo-600 py-4 font-bold text-white">
            Save all questions
          </button>
        </form>
      </div>
    </main>
  );
}