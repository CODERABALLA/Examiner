"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import StudySelector from "@/components/study/StudySelector";
import {
  findStartQuestion,
  getQuestions,
  getUnitQuestions,
  isMathematicsSubject,
  type Question,
} from "@/lib/questions";

export default function StudyPage() {
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getQuestions()
      .then(setQuestions)
      .catch((err) => {
        console.error(err);
        setError("Could not load study options.");
      })
      .finally(() => setLoading(false));
  }, []);

  function start(subject: string, unit: string) {
    const unitQuestions = getUnitQuestions(questions, subject, unit);

    if (unitQuestions.length === 0) {
      router.push(`/study?subject=${encodeURIComponent(subject)}&unit=${encodeURIComponent(unit)}&empty=1`);
      return;
    }

    const startQuestion = findStartQuestion(questions, subject, unit);

    if (startQuestion) {
      saveResume(subject, unit);
      router.push(`/questions/${startQuestion.id}?subject=${encodeURIComponent(subject)}&unit=${encodeURIComponent(unit)}`);
      return;
    }

    router.push(`/study?subject=${encodeURIComponent(subject)}&unit=${encodeURIComponent(unit)}&done=1`);
  }

  function saveResume(subject: string, unit: string) {
    try {
      localStorage.setItem(
        "examiner_last_study",
        JSON.stringify({ subject, unit, at: new Date().toISOString() })
      );
    } catch {
      // ignore
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <header>
          <Link
            href="/"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            ← Dashboard
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Choose what to study
          </h1>
          <p className="mt-2 text-slate-600">
            Pick a subject and topic to continue from where you left off.
          </p>
        </header>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          {loading && (
            <div className="py-16 text-center text-slate-500">
              Loading study options…
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 p-6 text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && questions.length === 0 && (
            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-900">
                No questions yet.
              </h2>
              <p className="mt-2 text-slate-500">
                Add your first question to start studying.
              </p>
              <Link
                href="/questions/new"
                className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white hover:bg-indigo-700"
              >
                + Add question
              </Link>
            </div>
          )}

          {!loading && !error && questions.length > 0 && (
            <StudySelector questions={questions} onStart={start} />
          )}
        </section>

        <Suspense fallback={null}>
          <StudyResultBanner questions={questions} />
        </Suspense>
      </div>
    </main>
  );
}

function StudyResultBanner({ questions }: { questions: Question[] }) {
  const router = useRouter();
  const params = useSearchParams();

  const subject = params.get("subject");
  const unit = params.get("unit");
  const done = params.get("done") === "1";
  const empty = params.get("empty") === "1";

  if (!subject || !unit) return null;

  if (empty) {
    return (
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold text-slate-900">
          No questions in this topic yet.
        </h2>
        <p className="mt-1 text-slate-500">{subject} — {unit}</p>
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => router.push("/study")}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-700"
          >
            Choose another topic
          </button>
          <Link
            href={`/questions/new?subject=${encodeURIComponent(subject)}&unit=${encodeURIComponent(unit)}`}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 font-bold text-white"
          >
            + Add questions
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    const isMaths = isMathematicsSubject(subject);
    return (
      <div className="mt-6 rounded-3xl bg-emerald-50 p-8 text-center">
        <h2 className="text-2xl font-bold text-emerald-800">
          {unit} completed!
        </h2>
        <p className="mt-2 text-emerald-700">
          You&apos;ve completed all questions in {isMaths ? "this chapter" : "this topic"}.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => {
              const first = getUnitQuestions(questions, subject, unit)[0];
              if (first) {
                router.push(
                  `/questions/${first.id}?subject=${encodeURIComponent(subject)}&unit=${encodeURIComponent(unit)}`
                );
              }
            }}
            className="rounded-xl bg-emerald-700 px-6 py-3 font-bold text-white hover:bg-emerald-800"
          >
            Study again
          </button>
          <button
            onClick={() => router.push("/study")}
            className="rounded-xl border border-emerald-300 bg-white px-6 py-3 font-bold text-emerald-700"
          >
            Choose another topic
          </button>
        </div>
      </div>
    );
  }

  return null;
}
