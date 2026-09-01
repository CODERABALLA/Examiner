"use client";

import { useMemo, useState } from "react";
import {
  getUnitStats,
  type Question,
} from "@/lib/questions";

// Subject -> Topic/Unit selection generated from stored questions.
export default function StudySelector({
  questions,
  onStart,
}: {
  questions: Question[];
  onStart: (subject: string, unit: string) => void;
}) {
  const subjects = useMemo(
    () => [...new Set(questions.map((q) => q.subject))].sort(),
    [questions]
  );

  const [subject, setSubject] = useState<string>("");
  const [unit, setUnit] = useState<string>("");

  const units = useMemo(
    () =>
      subject
        ? [
            ...new Set(
              questions
                .filter((q) => q.subject === subject)
                .map((q) => q.unit)
            ),
          ].sort()
        : [],
    [questions, subject]
  );

  if (questions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor="study-subject"
          className="block text-sm font-bold uppercase tracking-wider text-slate-500"
        >
          Subject
        </label>
        <select
          id="study-subject"
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value);
            setUnit("");
          }}
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-4 text-lg font-semibold text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        >
          <option value="">Select a subject…</option>
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="study-unit"
          className="block text-sm font-bold uppercase tracking-wider text-slate-500"
        >
          Topic / Chapter
        </label>
        <select
          id="study-unit"
          value={unit}
          disabled={!subject}
          onChange={(e) => setUnit(e.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-4 text-lg font-semibold text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50 disabled:text-slate-400"
        >
          <option value="">{subject ? "Select a topic…" : "Choose a subject first"}</option>
          {units.map((u) => {
            const stats = getUnitStats(questions, subject, u);
            return (
              <option key={u} value={u}>
                {u} ({stats.completed}/{stats.total} done)
              </option>
            );
          })}
        </select>
      </div>

      <button
        type="button"
        disabled={!subject || !unit}
        onClick={() => onStart(subject, unit)}
        className="w-full rounded-2xl bg-indigo-600 py-4 text-lg font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Start studying →
      </button>
    </div>
  );
}
