import { type Difficulty } from "@/lib/questions";

const STYLES: Record<Difficulty, string> = {
  Easy: "bg-emerald-100 text-emerald-700",
  Intermediate: "bg-amber-100 text-amber-700",
  Advanced: "bg-rose-100 text-rose-700",
};

export default function DifficultyBadge({
  difficulty,
  locked,
}: {
  difficulty: Difficulty;
  locked?: boolean;
}) {
  if (locked) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-400">
        <LockIcon /> Locked
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${STYLES[difficulty]}`}
    >
      {difficulty}
    </span>
  );
}

function LockIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
