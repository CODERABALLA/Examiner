"use client";

import { useState } from "react";
import { type Difficulty } from "@/lib/questions";

export type QuestionFormValues = {
  question: string;
  answer: string;
  subject: string;
  unit: string;
  difficulty: Difficulty;
  dueAt: string | null;
};

export default function QuestionForm({
  initial,
  submitLabel,
  onSubmit,
  busy,
  error,
}: {
  initial: Partial<QuestionFormValues>;
  submitLabel: string;
  onSubmit: (values: QuestionFormValues) => Promise<void>;
  busy?: boolean;
  error?: string | null;
}) {
  const [question, setQuestion] = useState(initial.question ?? "");
  const [answer, setAnswer] = useState(initial.answer ?? "");
  const [subject, setSubject] = useState(initial.subject ?? "");
  const [unit, setUnit] = useState(initial.unit ?? "");
  const [difficulty, setDifficulty] = useState<Difficulty>(
    initial.difficulty ?? "Easy"
  );
  const [dueAt, setDueAt] = useState(
    initial.dueAt
      ? new Date(initial.dueAt).toISOString().slice(0, 16)
      : ""
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    await onSubmit({
      question,
      answer,
      subject,
      unit,
      difficulty,
      dueAt: dueAt ? new Date(dueAt).toISOString() : null,
    });
  }

  return (
    <form
      onSubmit={submit}
      className="mt-8 rounded-2xl bg-white p-6 shadow-sm"
    >
      <Field label="Subject">
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-300 p-3"
          placeholder="e.g. Mathematics"
          required
        />
      </Field>

      <Field label="Unit / Chapter" className="mt-5">
        <input
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-300 p-3"
          placeholder="e.g. Algebra"
          required
        />
      </Field>

      <Field label="Difficulty" className="mt-5">
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
      </Field>

      <Field label="Due date and time (optional)" className="mt-5">
        <input
          type="datetime-local"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-300 p-3"
        />
      </Field>

      <Field label="Question" className="mt-5">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={6}
          className="mt-2 w-full rounded-xl border border-slate-300 p-3"
          required
        />
      </Field>

      <Field label="Answer" className="mt-5">
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={10}
          className="mt-2 w-full rounded-xl border border-slate-300 p-3"
          required
        />
      </Field>

      {error && (
        <p className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>
      )}

      <button
        disabled={busy}
        className="mt-6 w-full rounded-xl bg-indigo-600 py-4 font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {busy ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block font-semibold ${className ?? ""}`}>
      {label}
      {children}
    </label>
  );
}
