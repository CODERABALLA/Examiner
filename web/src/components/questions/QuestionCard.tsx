"use client";

import Link from "next/link";
import DifficultyBadge from "@/components/study/DifficultyBadge";
import { type Question } from "@/lib/questions";

export default function QuestionCard({
  question,
  index,
}: {
  question: Question;
  index?: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {question.completed && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                ✓ Complete
              </span>
            )}
            <DifficultyBadge difficulty={question.difficulty} />
          </div>

          <p className="mt-3 font-semibold text-slate-900">
            {typeof index === "number" ? `${index + 1}. ` : ""}
            {question.question}
          </p>

          <p className="mt-2 text-sm text-slate-600">{question.answer}</p>

          {question.dueAt && (
            <p className="mt-2 text-xs font-medium text-slate-400">
              Due: {new Date(question.dueAt).toLocaleString()}
            </p>
          )}
        </div>

        <Link
          href={`/questions/${question.id}`}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
        >
          Open / Edit
        </Link>
      </div>
    </div>
  );
}
