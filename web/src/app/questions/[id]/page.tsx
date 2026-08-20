"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getQuestion,
  getQuestions,
  updateQuestion,
  deleteQuestion,
  getUnlockedDifficulty,
  type Difficulty,
  type Question,
} from "@/lib/questions";

export default function QuestionPage() {
  const params = useParams();
  const router = useRouter();

  const [question, setQuestion] = useState<Question | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [all, found] = await Promise.all([
          getQuestions(),
          getQuestion(String(params.id)),
        ]);
        setQuestions(all);
        setQuestion(found);
      } catch (err) {
        console.error("Failed to load question:", err);
      }
    }
    load();
  }, [params.id]);

  if (!question) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div>
          <h1 className="text-2xl font-bold">
            Question not found
          </h1>
          <Link
            href="/questions"
            className="mt-4 inline-block text-indigo-600"
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

  const sameUnit = questions.filter(
    (q) =>
      q.subject === question.subject &&
      q.unit === question.unit
  );

  const currentIndex = sameUnit.findIndex(
    (q) => q.id === question.id
  );

  const previous =
    currentIndex > 0 ? sameUnit[currentIndex - 1] : null;

  const next =
    currentIndex < sameUnit.length - 1
      ? sameUnit[currentIndex + 1]
      : null;

  const unlocked = getUnlockedDifficulty(
    questions,
    question.subject,
    question.unit
  );

  async function markCompleteAndNext() {
    if (!question) return;
    try {
      await updateQuestion(question.id, {
        completed: true,
      });
    } catch (err) {
      console.error("Failed to mark complete:", err);
    }

    if (next) {
      router.push(`/questions/${next.id}`);
    } else {
      router.push("/questions");
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this question?")) return;
    if (!question) return;

    try {
      await deleteQuestion(question.id);
    } catch (err) {
      console.error("Failed to delete question:", err);
    }
    router.push("/questions");
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="flex items-center justify-between">
          <Link
            href="/questions"
            className="text-sm text-slate-600"
          >
            ← All questions
          </Link>

          <span className="text-sm font-semibold text-slate-500">
            {question.difficulty}
          </span>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
              {question.subject}
            </span>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              {question.unit}
            </span>

            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
              {question.difficulty}
            </span>
          </div>

          {question.dueAt && (
            <p className="mt-4 text-sm font-medium text-slate-500">
              Due: {new Date(question.dueAt).toLocaleString()}
            </p>
          )}

          <p className="mt-8 text-xs font-bold uppercase tracking-wider text-slate-500">
            Question
          </p>

          <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-900">
            {question.question}
          </h1>

          {!showAnswer ? (
            <button
              onClick={() => setShowAnswer(true)}
              className="mt-10 w-full rounded-2xl bg-indigo-600 py-4 text-lg font-bold text-white"
            >
              Reveal answer
            </button>
          ) : (
            <>
              <div className="mt-10 border-t border-slate-200 pt-8">
                <p className="text-sm font-bold uppercase tracking-wider text-emerald-600">
                  Answer
                </p>

                <p className="mt-3 whitespace-pre-wrap text-lg leading-8 text-slate-900">
                  {question.answer}
                </p>
              </div>

              <button
                onClick={markCompleteAndNext}
                className="mt-8 w-full rounded-xl bg-emerald-600 py-4 font-bold text-white"
              >
                Mark complete & continue →
              </button>

              <p className="mt-3 text-center text-sm text-slate-500">
                Completing all {question.difficulty} questions unlocks
                the next level.
              </p>
            </>
          )}

          <div className="mt-8 border-t border-slate-200 pt-6">
            <p className="text-sm text-slate-500">
              Current unlocked level for this unit:{" "}
              <strong>{unlocked}</strong>
            </p>

            <button
              onClick={() => setEditing(true)}
              className="mt-4 w-full rounded-xl border border-indigo-300 bg-indigo-50 py-3 font-bold text-indigo-700"
            >
              Edit question / answer
            </button>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            disabled={!previous}
            onClick={() =>
              previous &&
              router.push(`/questions/${previous.id}`)
            }
            className="flex-1 rounded-xl border border-slate-300 bg-white px-5 py-4 font-bold disabled:opacity-40"
          >
            ← Previous
          </button>

          <button
            disabled={!next}
            onClick={() =>
              next && router.push(`/questions/${next.id}`)
            }
            className="flex-1 rounded-xl bg-indigo-600 px-5 py-4 font-bold text-white disabled:opacity-40"
          >
            Next →
          </button>
        </div>

        <button
          onClick={handleDelete}
          className="mt-5 w-full rounded-xl border border-red-200 bg-red-50 py-3 font-semibold text-red-700"
        >
          Delete this question
        </button>
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

  async function save(e: React.FormEvent) {
    e.preventDefault();

    await updateQuestion(question.id, {
      question: q,
      answer,
      subject,
      unit,
      difficulty,
      dueAt: dueAt
        ? new Date(dueAt).toISOString()
        : null,
    });

    const updated = await getQuestion(question.id);
    if (updated) onSaved(updated);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <button
          onClick={onCancel}
          className="text-sm text-slate-600"
        >
          ← Cancel
        </button>

        <h1 className="mt-3 text-3xl font-bold">
          Edit question
        </h1>

        <form
          onSubmit={save}
          className="mt-8 rounded-2xl bg-white p-6 shadow-sm"
        >
          <label className="font-semibold">Subject</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-2 w-full rounded-xl border p-3"
          />

          <label className="mt-5 block font-semibold">
            Unit / Chapter
          </label>
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="mt-2 w-full rounded-xl border p-3"
          />

          <label className="mt-5 block font-semibold">
            Difficulty
          </label>
          <select
            value={difficulty}
            onChange={(e) =>
              setDifficulty(e.target.value as Difficulty)
            }
            className="mt-2 w-full rounded-xl border bg-white p-3"
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
            className="mt-2 w-full rounded-xl border p-3"
          />

          <label className="mt-5 block font-semibold">
            Question
          </label>
          <textarea
            value={q}
            onChange={(e) => setQ(e.target.value)}
            rows={6}
            className="mt-2 w-full rounded-xl border p-3"
          />

          <label className="mt-5 block font-semibold">
            Answer
          </label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={10}
            className="mt-2 w-full rounded-xl border p-3"
          />

          <button className="mt-6 w-full rounded-xl bg-indigo-600 py-4 font-bold text-white">
            Save changes
          </button>
        </form>
      </div>
    </main>
  );
}