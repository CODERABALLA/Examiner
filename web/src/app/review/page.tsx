"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getQuestions, type Question } from "@/lib/questions";

export default function ReviewPage() {
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    setQuestions(getQuestions());
  }, []);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-10">

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold tracking-widest text-indigo-600">
              EXAMINER
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Questions & Answers
            </h1>
          </div>

          <Link
            href="/questions"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100"
          >
            ← Questions
          </Link>
        </div>

        <p className="mt-3 text-slate-600">
          Review all questions and their correct answers together.
        </p>

        <div className="mt-8 space-y-5">

          {questions.map((question, index) => (
            <article
              key={question.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-bold text-indigo-600">
                  Question {index + 1}
                </span>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {question.subject || "General"}
                </span>
              </div>

              <h2 className="mt-4 text-xl font-bold leading-8 text-slate-900">
                {question.question}
              </h2>

              <div className="mt-5 border-t border-slate-200 pt-5">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                  Correct answer
                </p>

                <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-800">
                  {question.answer}
                </p>
              </div>

            </article>
          ))}

        </div>

        {questions.length === 0 && (
          <div className="mt-8 rounded-2xl bg-white p-8 text-center text-slate-500">
            No questions have been added yet.
          </div>
        )}

      </div>
    </main>
  );
}
