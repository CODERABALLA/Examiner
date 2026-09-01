"use client";

import { useState } from "react";

// A student's own working space for maths. Rendered as a grid-paper
// textarea. Content is kept in local/browser state only — it is the
// student's scratch area and is deliberately separate from the answer.
export default function MathsWorkspace({
  questionId,
}: {
  questionId: string;
}) {
  const storageKey = `maths_working_${questionId}`;
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ?? "";
    } catch {
      return "";
    }
  });

  function handleChange(next: string) {
    setValue(next);
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // ignore storage access errors
    }
  }

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Your working space
        </p>

        {value && (
          <button
            type="button"
            onClick={() => handleChange("")}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            Clear working
          </button>
        )}
      </div>

      <textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        rows={14}
        spellCheck={false}
        placeholder="Work out your calculation here…
2x + 7 = 19"
        aria-label="Mathematics working space"
        className="maths-grid mt-3 w-full resize-y rounded-xl border border-slate-200 p-4 font-mono text-base text-slate-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      />
    </section>
  );
}
