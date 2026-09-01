"use client";

import QuestionCard from "@/components/questions/QuestionCard";
import { type Question } from "@/lib/questions";

// Groups questions by subject then unit, and renders each in a card.
export default function QuestionList({
  questions,
}: {
  questions: Question[];
}) {
  const subjects = [...new Set(questions.map((q) => q.subject))];

  return (
    <div className="space-y-6">
      {subjects.map((subject) => {
        const subjectQuestions = questions.filter(
          (q) => q.subject === subject
        );
        const units = [...new Set(subjectQuestions.map((q) => q.unit))];

        return (
          <section
            key={subject}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-slate-900">{subject}</h2>

            <div className="mt-5 space-y-5">
              {units.map((unit) => {
                const unitQuestions = subjectQuestions
                  .filter((q) => q.unit === unit)
                  .sort((a, b) => a.sortOrder - b.sortOrder);

                return (
                  <div key={unit}>
                    <h3 className="mb-3 text-lg font-bold text-indigo-700">
                      {unit}
                    </h3>
                    <div className="space-y-3">
                      {unitQuestions.map((q, index) => (
                        <QuestionCard
                          key={q.id}
                          question={q}
                          index={index}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
