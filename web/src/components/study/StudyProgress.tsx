import { DIFFICULTY_ORDER, type Difficulty } from "@/lib/questions";

// Compact progress summary for the study pages / dashboard.
export default function StudyProgress({
  completed,
  total,
  currentDifficulty,
  lockedDifficulties = [],
}: {
  completed: number;
  total: number;
  currentDifficulty?: Difficulty | null;
  lockedDifficulties?: Difficulty[];
}) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-700">
          {completed} of {total} completed
        </span>
        <span className="font-bold text-indigo-600">{pct}%</span>
      </div>

      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      {currentDifficulty && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          {DIFFICULTY_ORDER.map((level) => {
            const isCurrent = level === currentDifficulty;
            const isLocked = lockedDifficulties.includes(level);

            return (
              <span
                key={level}
                className={`rounded-full px-2.5 py-1 ${
                  isCurrent
                    ? "bg-indigo-600 text-white"
                    : isLocked
                      ? "bg-slate-100 text-slate-400"
                      : "bg-slate-100 text-slate-700"
                }`}
              >
                {level}
                {isCurrent ? " ◀" : ""}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
