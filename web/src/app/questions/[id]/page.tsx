"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import DifficultyBadge from "@/components/study/DifficultyBadge";
import MathsWorkspace from "@/components/study/MathsWorkspace";
import StudyProgress from "@/components/study/StudyProgress";
import {
  deleteQuestion,
  findStartQuestion,
  getNextNavigableQuestion,
  getPrevStudyQuestion,
  getQuestion,
  getQuestions,
  getUnitQuestions,
  getUnitStats,
  isMathematicsSubject,
  isDifficultyUnlocked,
  updateQuestion,
  type Difficulty,
  type Question,
} from "@/lib/questions";

export default function QuestionPage() {
  return (
    <Suspense fallback={null}>
      <QuestionPageInner />
    </Suspense>
  );
}

function QuestionPageInner() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [question, setQuestion] = useState<Question | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [editing, setEditing] = useState(false);
  const [completeError, setCompleteError] = useState("");
  const [savingComplete, setSavingComplete] = useState(false);
  const [unitComplete, setUnitComplete] = useState(false);

  const requestedSubject = searchParams.get("subject");
  const requestedUnit = searchParams.get("unit");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setNotFound(false);
      setQuestion(null);
      setShowAnswer(false);
      setUnitComplete(false);
      setCompleteError("");

      try {
        const [all, found] = await Promise.all([
          getQuestions(),
          getQuestion(String(params.id)),
        ]);
        if (cancelled) return;
        setQuestions(all);
        if (found) {
          setQuestion(found);
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Failed to load question:", err);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-lg text-slate-500">Loading question…</p>
      </main>
    );
  }

  if (notFound || !question) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            Question not found
          </h1>
          <Link
            href="/questions"
            className="mt-4 inline-block text-indigo-600 hover:text-indigo-800"
          >
            ← Questions
          </Link>
        </div>
      </main>
    );
  }

  if (editing) {
    return (
      <EditQuestion
        question={question}
        onCancel={() => setEditing(false)}
        onSaved={(updated) => {
          setQuestion(updated);
          getQuestions().then(setQuestions).catch(console.error);
          setEditing(false);
        }}
      />
    );
  }

  if (unitComplete) {
    return (
      <CompletedUnit
        subject={question.subject}
        unit={question.unit}
        questions={questions}
        onRestart={() => {
          const first = getUnitQuestions(
            questions,
            question.subject,
            question.unit
          )[0];
          if (first) {
            router.push(
              `/questions/${first.id}?subject=${encodeURIComponent(
                question.subject
              )}&unit=${encodeURIComponent(question.unit)}`
            );
          }
        }}
        onChangeTopic={() => router.push("/study")}
      />
    );
  }

  const subject = requestedSubject ?? question.subject;
  const unit = requestedUnit ?? question.unit;
  const isMaths = isMathematicsSubject(subject);

  const unitQuestions = getUnitQuestions(questions, subject, unit);
  const sameLevel = unitQuestions.filter(
    (q) => q.difficulty === question.difficulty
  );
  const levelIndex = sameLevel.findIndex((q) => q.id === question.id);
  const stats = getUnitStats(questions, subject, unit);
  const currentLevel = question.difficulty;

  const previousQuestion = getPrevStudyQuestion(
    questions,
    subject,
    unit,
    question.id
  );
  const nextQuestion = getNextNavigableQuestion(
    questions,
    subject,
    unit,
    question.id
  );

  function navigateTo(q: Question) {
    router.push(
      `/questions/${q.id}?subject=${encodeURIComponent(
        subject
      )}&unit=${encodeURIComponent(unit)}`
    );
  }

  const intermediateLocked =
    currentLevel === "Intermediate" &&
    !isDifficultyUnlocked(unitQuestions, "Intermediate");
  const advancedLocked =
    currentLevel === "Advanced" &&
    !isDifficultyUnlocked(unitQuestions, "Advanced");

  async function markCompleteAndNext() {
    if (!question) return;

    setCompleteError("");
    setSavingComplete(true);

    try {
      await updateQuestion(question.id, { completed: true });
    } catch (err) {
      console.error("Failed to mark complete:", err);
      setSavingComplete(false);
      setCompleteError(
        "Could not save your progress. Please try again."
      );
      return;
    }

    const updated = questions.map((q) =>
      q.id === question.id ? { ...q, completed: true } : q
    );
    setQuestions(updated);

    const next = findStartQuestion(updated, subject, unit);

    setSavingComplete(false);

    if (next) {
      router.push(
        `/questions/${next.id}?subject=${encodeURIComponent(
          subject
        )}&unit=${encodeURIComponent(unit)}`
      );
    } else {
      setShowAnswer(true);
      setUnitComplete(true);
    }
  }

  async function handleDelete() {
    if (!question) return;
    if (!window.confirm("Delete this question?")) return;

    try {
      await deleteQuestion(question.id);
    } catch (err) {
      console.error("Failed to delete question:", err);
      alert("Could not delete question. Please try again.");
      return;
    }
    router.push("/questions");
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="flex items-center justify-between">
          <Link
            href="/study"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            ← Choose what to study
          </Link>

          <span className="text-sm font-semibold text-slate-500">
            {question.difficulty}
          </span>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
              {subject}
            </span>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              {unit}
            </span>

            <DifficultyBadge
              difficulty={currentLevel}
              locked={intermediateLocked || advancedLocked}
            />
          </div>

          <div className="mt-6">
            <StudyProgress
              completed={stats.completed}
              total={stats.total}
              currentDifficulty={currentLevel}
            />
          </div>

          {question.dueAt && (
            <p className="mt-4 text-sm font-medium text-slate-500">
              Due: {new Date(question.dueAt).toLocaleString()}
            </p>
          )}

          <p className="mt-8 text-xs font-bold uppercase tracking-wider text-slate-500">
            Question
            {levelIndex >= 0 && sameLevel.length > 1
              ? ` ${levelIndex + 1} of ${sameLevel.length}`
              : ""}
          </p>

          <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-900">
            {question.question}
          </h1>

          {!showAnswer && isMaths && !question.completed && (
            <MathsWorkspace questionId={question.id} />
          )}

          {!showAnswer ? (
            <button
              onClick={() => setShowAnswer(true)}
              className="mt-10 w-full rounded-2xl bg-indigo-600 py-4 text-lg font-bold text-white hover:bg-indigo-700"
            >
              Reveal answer
            </button>
          ) : (
            <>
              <div className="mt-10 border-t border-slate-200 pt-8">
                <p className="text-sm font-bold uppercase tracking-wider text-emerald-600">
                  Correct answer
                </p>

                <p className="mt-3 whitespace-pre-wrap text-lg leading-8 text-slate-900">
                  {question.answer}
                </p>
              </div>

              {completeError && (
                <p className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">
                  {completeError}
                </p>
              )}

              <button
                onClick={markCompleteAndNext}
                disabled={savingComplete}
                className="mt-8 w-full rounded-xl bg-emerald-600 py-4 font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {savingComplete
                  ? "Saving…"
                  : question.completed
                    ? "Continue →"
                    : "Mark complete & continue →"}
              </button>

              <p className="mt-3 text-center text-sm text-slate-500">
                Completing all {question.difficulty} questions unlocks the
                next level.
              </p>
            </>
          )}

          <div className="mt-8 border-t border-slate-200 pt-6">
            <p className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Navigate
            </p>

            <div className="mt-3 flex gap-3">
              <button
                disabled={!previousQuestion}
                onClick={() => previousQuestion && navigateTo(previousQuestion)}
                className="flex-1 rounded-xl border border-slate-300 bg-white px-5 py-4 font-bold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Previous
              </button>

              <button
                disabled={!nextQuestion}
                onClick={() => nextQuestion && navigateTo(nextQuestion)}
                className="flex-1 rounded-xl bg-indigo-600 px-5 py-4 font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next →
              </button>
            </div>

            {!nextQuestion && !question.completed && (
              <p className="mt-3 text-sm text-slate-500">
                Complete the remaining {question.difficulty} questions to
                unlock the next level.
              </p>
            )}
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => setEditing(true)}
                className="flex-1 rounded-xl border border-indigo-300 bg-indigo-50 py-3 font-bold text-indigo-700 hover:bg-indigo-100"
              >
                Edit question / answer
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 rounded-xl border border-red-200 bg-red-50 py-3 font-bold text-red-700 hover:bg-red-100"
              >
                Delete this question
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function CompletedUnit({
  subject,
  unit,
  questions,
  onRestart,
  onChangeTopic,
}: {
  subject: string;
  unit: string;
  questions: Question[];
  onRestart: () => void;
  onChangeTopic: () => void;
}) {
  const isMaths = isMathematicsSubject(subject);
  const state = getUnitStats(questions, subject, unit);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="mx-auto max-w-md px-6 py-10 text-center">
        <div className="rounded-3xl bg-emerald-50 p-10">
          <h1 className="text-3xl font-bold text-emerald-800">
            {unit} completed!
          </h1>
          <p className="mt-3 text-emerald-700">
            You&apos;ve completed {state.completed} of {state.total} questions
            in {isMaths ? "this chapter" : "this topic"}.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={onRestart}
              className="rounded-xl bg-emerald-700 py-3.5 font-bold text-white hover:bg-emerald-800"
            >
              Study again
            </button>
            <button
              onClick={onChangeTopic}
              className="rounded-xl border border-emerald-300 bg-white py-3.5 font-bold text-emerald-700 hover:bg-emerald-100"
            >
              Choose another topic
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function EditQuestion({
  question,
  onCancel,
  onSaved,
}: {
  question: Question;
  onCancel: () => void;
  onSaved: (question: Question) => void;
}) {
  const [q, setQ] = useState(question.question);
  const [answer, setAnswer] = useState(question.answer);
  const [subject, setSubject] = useState(question.subject);
  const [unit, setUnit] = useState(question.unit);
  const [difficulty, setDifficulty] =
    useState<Difficulty>(question.difficulty);
  const [dueAt, setDueAt] = useState(
    question.dueAt
      ? new Date(question.dueAt).toISOString().slice(0, 16)
      : ""
  );
  const [error, setError] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      await updateQuestion(question.id, {
        question: q,
        answer,
        subject,
        unit,
        difficulty,
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
      });
    } catch (err) {
      console.error("Failed to save question:", err);
      setError("Could not save your changes. Please try again.");
      return;
    }

    const updated = await getQuestion(question.id);
    if (updated) onSaved(updated);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <button
          onClick={onCancel}
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          ← Cancel
        </button>

        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          Edit question
        </h1>

        <form
          onSubmit={save}
          className="mt-8 rounded-2xl bg-white p-6 shadow-sm"
        >
          <label className="block font-semibold">Subject</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 p-3"
          />

          <label className="mt-5 block font-semibold">
            Unit / Chapter
          </label>
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 p-3"
          />

          <label className="mt-5 block font-semibold">Difficulty</label>
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
            Due date and time (optional)
          </label>
          <input
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 p-3"
          />

          <label className="mt-5 block font-semibold">Question</label>
          <textarea
            value={q}
            onChange={(e) => setQ(e.target.value)}
            rows={6}
            className="mt-2 w-full rounded-xl border border-slate-300 p-3"
          />

          <label className="mt-5 block font-semibold">Answer</label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={10}
            className="mt-2 w-full rounded-xl border border-slate-300 p-3"
          />

          {error && (
            <p className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">
              {error}
            </p>
          )}

          <button className="mt-6 w-full rounded-xl bg-indigo-600 py-4 font-bold text-white hover:bg-indigo-700">
            Save changes
          </button>
        </form>
      </div>
    </main>
  );
}
