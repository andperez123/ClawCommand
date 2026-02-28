import type {
  Snapshot as BaseSnapshot,
  ValidationResult,
  PolicyResult,
  ScanDiff,
} from "@clawcommand/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export interface ScanSummary {
  scanId: string;
  timestamp: string;
  workspacePath: string;
}

export interface EnrichedSnapshot extends BaseSnapshot {
  validation?: ValidationResult;
  policy?: PolicyResult;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new ApiError(res.status, `API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchScans(): Promise<ScanSummary[]> {
  const data = await request<{ scans: ScanSummary[] }>("/api/scans");
  return data.scans ?? [];
}

export async function fetchScan(id: string): Promise<EnrichedSnapshot> {
  return request<EnrichedSnapshot>(`/api/scans/${encodeURIComponent(id)}`);
}

export async function fetchDiff(scanIdA: string, scanIdB: string): Promise<ScanDiff> {
  return request<ScanDiff>(
    `/api/scans/diff?a=${encodeURIComponent(scanIdA)}&b=${encodeURIComponent(scanIdB)}`
  );
}
