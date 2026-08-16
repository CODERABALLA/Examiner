"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getQuestions,
  getUnlockedDifficulty,
  type Question,
} from "@/lib/questions";

export default function Home() {
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    setQuestions(getQuestions());
  }, []);

  const subjects = [...new Set(questions.map((q) => q.subject))];

  const due = questions.filter(
    (q) => q.dueAt && new Date(q.dueAt).getTime() <= Date.now()
  );

  const units = [...new Set(
    questions.map((q) => `${q.subject}|||${q.unit}`)
  )].map((key) => {
    const [subject, unit] = key.split("|||");
    return { subject, unit };
  });

  const currentUnit = units.find(({ subject, unit }) =>
    questions.some(
      (q) =>
        q.subject === subject &&
        q.unit === unit &&
        !q.completed
    )
  );

  const currentIndex = currentUnit
    ? units.findIndex(
      (u) =>
        u.subject === currentUnit.subject &&
        u.unit === currentUnit.unit
    )
    : -1;

  const nextUnit =
    currentIndex >= 0 && currentIndex < units.length - 1
      ? units[currentIndex + 1]
      : null;

  const startQuestion = currentUnit
    ? questions.find(
      (q) =>
        q.subject === currentUnit.subject &&
        q.unit === currentUnit.unit &&
        !q.completed &&
        q.difficulty ===
        getUnlockedDifficulty(
          questions,
          currentUnit.subject,
          currentUnit.unit
        )
    )
    : null;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header>
          <p className="text-sm font-bold tracking-widest text-indigo-600">
            EXAMINER
          </p>

          <h1 className="mt-2 text-4xl font-bold text-slate-900">
            Study smarter.
          </h1>

          <p className="mt-3 max-w-2xl text-lg text-slate-600">
            Work through each subject, unit and difficulty level in order.
          </p>
        </header>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <Stat label="Total questions" value={questions.length} />
          <Stat label="Due now" value={due.length} red />
          <Stat label="Subjects" value={subjects.length} />
        </div>

        {currentUnit ? (
          <section className="mt-8 rounded-3xl border-2 border-indigo-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wider text-indigo-600">
              Current unit
            </p>

            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              {currentUnit.unit}
            </h2>

            <p className="mt-2 text-slate-500">
              {currentUnit.subject}
            </p>

            <p className="mt-4 font-semibold text-slate-700">
              Current level:{" "}
              <span className="text-indigo-600">
                {getUnlockedDifficulty(
                  questions,
                  currentUnit.subject,
                  currentUnit.unit
                )}
              </span>
            </p>

            {startQuestion && (
              <Link
                href={`/questions/${startQuestion.id}`}
                className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white hover:bg-indigo-700"
              >
                Start studying →
              </Link>
            )}
          </section>
        ) : (
          <section className="mt-8 rounded-3xl bg-emerald-50 p-8">
            <h2 className="text-2xl font-bold text-emerald-800">
              All questions completed 🎉
            </h2>
            <p className="mt-2 text-emerald-700">
              Add more questions or review your completed work.
            </p>
          </section>
        )}

        {nextUnit && (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Up next
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              {nextUnit.unit}
            </h2>

            <p className="mt-1 text-slate-500">
              {nextUnit.subject}
            </p>
          </section>
        )}

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">
              Your subjects
            </h2>

            <Link
              href="/questions/new"
              className="rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white hover:bg-indigo-700"
            >
              + Add question
            </Link>
          </div>

          <div className="mt-5 space-y-4">
            {subjects.map((subject) => {
              const subjectUnits = units.filter(
                (u) => u.subject === subject
              );

              return (
                <details
                  key={subject}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  open
                >
                  <summary className="cursor-pointer px-6 py-5 text-xl font-bold text-slate-900">
                    {subject}
                  </summary>

                  <div className="space-y-3 border-t border-slate-100 p-4">
                    {subjectUnits.map((u) => {
                      const unitQuestions = questions.filter(
                        (q) =>
                          q.subject === subject &&
                          q.unit === u.unit
                      );

                      const unlocked = getUnlockedDifficulty(
                        questions,
                        subject,
                        u.unit
                      );

                      return (
                        <div
                          key={u.unit}
                          className="rounded-xl bg-slate-50 p-5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <h3 className="text-lg font-bold text-slate-900">
                                {u.unit}
                              </h3>

                              <p className="mt-1 text-sm text-slate-500">
                                {unitQuestions.length} questions ·{" "}
                                {unlocked} unlocked
                              </p>
                            </div>

                            <Link
                              href={`/questions?subject=${encodeURIComponent(
                                subject
                              )}&unit=${encodeURIComponent(u.unit)}`}
                              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                            >
                              View questions
                            </Link>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {["Easy", "Intermediate", "Advanced"].map(
                              (level) => {
                                const count = unitQuestions.filter(
                                  (q) => q.difficulty === level
                                ).length;

                                return (
                                  <span
                                    key={level}
                                    className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600"
                                  >
                                    {level}: {count}
                                  </span>
                                );
                              }
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </div>
        </section>

        <div className="mt-8">
          <Link
            href="/questions"
            className="font-semibold text-indigo-600 hover:text-indigo-800"
          >
            View all questions →
          </Link>
        </div>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  red,
}: {
  label: string;
  value: number;
  red?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border bg-white p-6 shadow-sm ${red ? "border-red-200" : "border-slate-200"
        }`}
    >
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p
        className={`mt-2 text-4xl font-bold ${red ? "text-red-600" : "text-slate-900"
          }`}
      >
        {value}
      </p>
    </div>
  );
}