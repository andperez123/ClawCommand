"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ScanDiff } from "@clawcommand/shared";
import { fetchScans, fetchScan, fetchDiff, type ScanSummary, type EnrichedSnapshot } from "../lib/api";
import { formatTimestamp } from "../lib/format";
import { ScanSidebar } from "../components/ScanSidebar";
import { AgentsList } from "../components/AgentsList";
import { SkillsList } from "../components/SkillsList";
import { McpServersList } from "../components/McpServersList";
import { ValidationPanel } from "../components/ValidationPanel";
import { PolicyPanel } from "../components/PolicyPanel";
import { RunsHistory } from "../components/RunsHistory";
import { DiffView } from "../components/DiffView";
import { ComplianceBadge } from "../components/ComplianceBadge";

type ViewMode = "inventory" | "diff";

export default function Home() {
  const [scans, setScans] = useState<ScanSummary[]>([]);
  const [selectedScan, setSelectedScan] = useState<EnrichedSnapshot | null>(null);
  const [diffScanA, setDiffScanA] = useState("");
  const [diffScanB, setDiffScanB] = useState("");
  const [diff, setDiff] = useState<ScanDiff | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("inventory");
  const [loading, setLoading] = useState(true);
  const [scanLoading, setScanLoading] = useState(false);
  const [diffLoading, setDiffLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const scanList = await fetchScans();
        if (cancelled) return;
        setScans(scanList);
        if (scanList.length > 0) {
          const first = await fetchScan(scanList[0].scanId);
          if (cancelled) return;
          setSelectedScan(first);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const loadScan = useCallback(async (id: string) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setScanLoading(true);
    setError(null);
    try {
      const data = await fetchScan(id);
      if (ctrl.signal.aborted) return;
      setSelectedScan(data);
    } catch (e) {
      if (ctrl.signal.aborted) return;
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (!ctrl.signal.aborted) setScanLoading(false);
    }
  }, []);

  const loadDiffHandler = useCallback(async () => {
    if (!diffScanA || !diffScanB) return;
    setDiffLoading(true);
    setError(null);
    try {
      const data = await fetchDiff(diffScanA, diffScanB);
      setDiff(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setDiffLoading(false);
    }
  }, [diffScanA, diffScanB]);

  if (loading) {
    return (
      <main className="p-8 max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">ClawCommand</h1>
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <div className="h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      </main>
    );
  }

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">ClawCommand</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          OpenClaw Control Dashboard — Configuration Intelligence & Compliance
        </p>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm flex justify-between items-start">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-4 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-200 font-medium shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ScanSidebar
          scans={scans}
          selectedScanId={selectedScan?.scanId ?? null}
          viewMode={viewMode}
          onSelectScan={loadScan}
          onChangeView={setViewMode}
        />

        <section className="lg:col-span-2">
          {viewMode === "diff" ? (
            <DiffView
              scans={scans}
              diffScanA={diffScanA}
              diffScanB={diffScanB}
              diff={diff}
              loading={diffLoading}
              onChangeScanA={(id) => { setDiffScanA(id); setDiff(null); }}
              onChangeScanB={(id) => { setDiffScanB(id); setDiff(null); }}
              onCompare={loadDiffHandler}
            />
          ) : selectedScan ? (
            <div className={scanLoading ? "opacity-50 pointer-events-none" : ""}>
              <div className="mb-4 flex items-center gap-4 flex-wrap">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Based on scan at {formatTimestamp(selectedScan.timestamp)}
                </span>
                {selectedScan.policy && (
                  <ComplianceBadge score={selectedScan.policy.complianceScore} />
                )}
              </div>
              <div className="space-y-6">
                <AgentsList agents={selectedScan.agents} />
                <SkillsList skills={selectedScan.skills} />
                <McpServersList servers={selectedScan.mcpServers} />
                {selectedScan.validation && (
                  <ValidationPanel validation={selectedScan.validation} />
                )}
                {selectedScan.policy && (
                  <PolicyPanel policy={selectedScan.policy} />
                )}
                {selectedScan.runs && (
                  <RunsHistory runs={selectedScan.runs} />
                )}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-400 dark:text-gray-500 italic">
              Select a scan or run a new scan to view inventory.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
