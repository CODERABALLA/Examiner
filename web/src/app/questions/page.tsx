"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getQuestions,
  type Question,
} from "@/lib/questions";

export default function QuestionsPage() {
  const [questions, setQuestions] =
    useState<Question[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await getQuestions();
        setQuestions(data);
      } catch (err) {
        console.error(err);
        setError("Could not load questions.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const subjects = [
    ...new Set(
      questions.map((q) => q.subject)
    ),
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-10">

        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/"
              className="text-sm text-slate-500 hover:text-slate-900"
            >
              ← Dashboard
            </Link>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              All Questions
            </h1>
          </div>

          <Link
            href="/questions/new"
            className="rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white"
          >
            + Add question
          </Link>
        </div>

        {loading && (
          <div className="mt-8 rounded-2xl bg-white p-10 text-center">
            Loading questions...
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-2xl bg-red-50 p-6 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="mt-8 space-y-6">
            {subjects.map((subject) => {
              const subjectQuestions =
                questions.filter(
                  (q) => q.subject === subject
                );

              const units = [
                ...new Set(
                  subjectQuestions.map(
                    (q) => q.unit
                  )
                ),
              ];

              return (
                <section
                  key={subject}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <h2 className="text-2xl font-bold text-slate-900">
                    {subject}
                  </h2>

                  <div className="mt-5 space-y-5">
                    {units.map((unit) => {
                      const unitQuestions =
                        subjectQuestions.filter(
                          (q) => q.unit === unit
                        );

                      return (
                        <div key={unit}>
                          <h3 className="mb-3 text-lg font-bold text-indigo-700">
                            {unit}
                          </h3>

                          <div className="space-y-3">
                            {unitQuestions.map(
                              (q, index) => (
                                <div
                                  key={q.id}
                                  className="rounded-xl border border-slate-200 p-5"
                                >
                                  <div className="flex flex-wrap items-start justify-between gap-3">

                                    <div className="flex-1">

                                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                                        {q.difficulty}
                                      </span>

                                      <p className="mt-3 font-semibold text-slate-900">
                                        {index + 1}.{" "}
                                        {q.question}
                                      </p>

                                      <p className="mt-2 text-sm text-slate-600">
                                        {q.answer}
                                      </p>

                                    </div>

                                    <Link
                                      href={`/questions/${q.id}`}
                                      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white"
                                    >
                                      Open / Edit
                                    </Link>

                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {!loading &&
          !error &&
          questions.length === 0 && (
            <div className="mt-8 rounded-2xl bg-white p-10 text-center text-slate-500">
              No questions yet.
            </div>
          )}

      </div>
    </main>
  );
}
