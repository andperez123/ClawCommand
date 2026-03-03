"use client";

export function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="pt-3">
      <span className="section-title">{label}</span>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
