"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DifficultyBadge from "@/components/study/DifficultyBadge";
import {
  findStartQuestion,
  getQuestions,
  getUnitQuestions,
  getUnitStats,
  getUnlockedDifficulty,
  isDifficultyUnlocked,
  DIFFICULTY_ORDER,
  type Question,
} from "@/lib/questions";

export default function Home() {
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [dueCount, setDueCount] = useState(0);
  const [resume, setResume] = useState<{
    subject: string;
    unit: string;
  } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const raw = localStorage.getItem("examiner_last_study");
        if (raw) setResume(JSON.parse(raw));
      } catch {
        // ignore
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    getQuestions()
      .then((data) => {
        setQuestions(data);
        setDueCount(
          data.filter(
            (q) => q.dueAt && new Date(q.dueAt).getTime() <= Date.now()
          ).length
        );
      })
      .catch((err) => {
        console.error("Failed to load questions:", err);
      });
  }, []);

  const subjects = [...new Set(questions.map((q) => q.subject))];

  const totalCompleted = questions.filter((q) => q.completed).length;
  const totalPending = questions.length - totalCompleted;

  const units = [...new Set(questions.map((q) => `${q.subject}|||${q.unit}`))]
    .map((key) => {
      const [subject, unit] = key.split("|||");
      return { subject, unit };
    })
    .sort((a, b) => a.subject.localeCompare(b.subject));

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
            Choose a subject and topic to study, then work through each
            difficulty level in order.
          </p>
        </header>

        <div className="mt-8 grid gap-5 md:grid-cols-4">
          <Stat label="Total questions" value={questions.length} />
          <Stat label="Completed" value={totalCompleted} />
          <Stat label="Due now" value={dueCount} red />
          <Stat label="Subjects" value={subjects.length} />
        </div>

        <section className="mt-8 rounded-3xl border-2 border-indigo-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wider text-indigo-600">
            Ready to study?
          </p>

          <p className="mt-2 text-slate-600">
            {questions.length === 0
              ? "Add your first question to begin studying."
              : `You have ${totalPending} question${totalPending === 1 ? "" : "s"} left across ${units.length} topic${units.length === 1 ? "" : "s"}.`}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/study"
              className="flex-1 rounded-2xl bg-indigo-600 px-6 py-4 text-center text-lg font-bold text-white hover:bg-indigo-700"
            >
              Start studying →
            </Link>

            {resume && (
              <button
                onClick={() => {
                  const start = findStartQuestion(
                    questions,
                    resume.subject,
                    resume.unit
                  );
                  if (start) {
                    router.push(
                      `/questions/${start.id}?subject=${encodeURIComponent(
                        resume.subject
                      )}&unit=${encodeURIComponent(resume.unit)}`
                    );
                  }
                }}
                className="flex-1 rounded-2xl border border-indigo-300 bg-indigo-50 px-6 py-4 text-lg font-bold text-indigo-700 hover:bg-indigo-100"
              >
                Continue where I left off →
              </button>
            )}
          </div>
        </section>

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
                      const unitQuestions = getUnitQuestions(
                        questions,
                        subject,
                        u.unit
                      );
                      const stats = getUnitStats(questions, subject, u.unit);
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
                                {stats.completed}/{stats.total} completed
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <div className="flex gap-1.5">
                                {DIFFICULTY_ORDER.map((level) => {
                                  const isUnlocked =
                                    isDifficultyUnlocked(
                                      unitQuestions,
                                      level
                                    ) &&
                                    unitQuestions.some(
                                      (qq) => qq.difficulty === level
                                    );
                                  return (
                                    <DifficultyBadge
                                      key={level}
                                      difficulty={level}
                                      locked={!isUnlocked}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <Link
                              href={`/questions?subject=${encodeURIComponent(
                                subject
                              )}&unit=${encodeURIComponent(u.unit)}`}
                              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                            >
                              View questions
                            </Link>

                            <Link
                              href={`/study?subject=${encodeURIComponent(
                                subject
                              )}&unit=${encodeURIComponent(u.unit)}`}
                              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700"
                            >
                              Study
                            </Link>
                          </div>

                          {unlocked === "Advanced" &&
                            stats.completed === stats.total && (
                              <p className="mt-3 text-sm font-semibold text-emerald-600">
                                ✓ Completed
                              </p>
                            )}
                        </div>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </div>
        </section>

        <div className="mt-8 flex flex-wrap gap-5">
          <Link
            href="/questions"
            className="font-semibold text-indigo-600 hover:text-indigo-800"
          >
            View all questions →
          </Link>
          <Link
            href="/review"
            className="font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Review answers →
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
      className={`rounded-2xl border bg-white p-6 shadow-sm ${
        red ? "border-red-200" : "border-slate-200"
      }`}
    >
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p
        className={`mt-2 text-4xl font-bold ${
          red ? "text-red-600" : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
