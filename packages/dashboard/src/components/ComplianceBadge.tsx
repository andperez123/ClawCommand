"use client";

interface Props {
  score: number;
}

export function ComplianceBadge({ score }: Props) {
  const style =
    score >= 100
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      : score >= 50
      ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";

  return (
    <span className={`text-xs font-medium px-2 py-1 rounded ${style}`}>
      Compliance: {Math.round(score)}%
    </span>
  );
}
