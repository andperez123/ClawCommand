"use client";

interface Props {
  score: number;
}

export function ComplianceBadge({ score }: Props) {
  const rounded = Math.round(score);
  const color =
    rounded >= 100
      ? "from-emerald-500 to-emerald-600"
      : rounded >= 50
      ? "from-amber-500 to-amber-600"
      : "from-rose-500 to-rose-600";

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full text-white bg-gradient-to-r ${color}`}>
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
      {rounded}%
    </span>
  );
}
