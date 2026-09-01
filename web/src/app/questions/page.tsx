"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import QuestionList from "@/components/questions/QuestionList";
import { getQuestions, type Question } from "@/lib/questions";

export default function QuestionsPage() {
  return (
    <Suspense fallback={null}>
      <QuestionsPageInner />
    </Suspense>
  );
}

function QuestionsPageInner() {
  const searchParams = useSearchParams();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const subjectFilter = searchParams.get("subject");
  const unitFilter = searchParams.get("unit");

  const filtered = questions.filter(
    (q) =>
      (!subjectFilter || q.subject === subjectFilter) &&
      (!unitFilter || q.unit === unitFilter)
  );

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
          <div className="mt-8 rounded-2xl bg-white p-10 text-center text-slate-500">
            Loading questions...
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-2xl bg-red-50 p-6 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="mt-8">
            <QuestionList questions={filtered} />
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="mt-8 rounded-2xl bg-white p-10 text-center text-slate-500">
            {questions.length === 0
              ? "No questions yet."
              : "No questions match this subject / topic."}
          </div>
        )}
      </div>
    </main>
  );
}
