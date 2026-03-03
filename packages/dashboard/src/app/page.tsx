"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ScanDiff } from "@clawcommand/shared";
import { fetchScans, fetchScan, fetchDiff, type ScanSummary, type EnrichedSnapshot } from "../lib/api";
import { ScanSidebar } from "../components/ScanSidebar";
import { HeroOverview } from "../components/HeroOverview";
import { ProjectGoals } from "../components/ProjectGoals";
import { ActivityTimeline } from "../components/ActivityTimeline";
import { CapabilityMap } from "../components/CapabilityMap";
import { AgentsList } from "../components/AgentsList";
import { SkillsList } from "../components/SkillsList";
import { McpServersList } from "../components/McpServersList";
import { RulesList } from "../components/RulesList";
import { ValidationPanel } from "../components/ValidationPanel";
import { PolicyPanel } from "../components/PolicyPanel";
import { RunsHistory } from "../components/RunsHistory";
import { DiffView } from "../components/DiffView";

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
      <main className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[50vh] gap-3 text-slate-400 dark:text-slate-500">
          <div className="h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading ClawCommand...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Top bar */}
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">ClawCommand</h1>
            <p className="text-xs text-slate-400 dark:text-slate-500">Configuration Intelligence & Compliance</p>
          </div>
        </div>
      </header>

      {error && (
        <div className="mb-6 p-4 glass-card border-rose-200/60 dark:border-rose-800/60 bg-rose-50/80 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-sm flex justify-between items-start rounded-xl">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-4 text-rose-500 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-200 font-medium shrink-0 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <ScanSidebar
          scans={scans}
          selectedScanId={selectedScan?.scanId ?? null}
          viewMode={viewMode}
          onSelectScan={loadScan}
          onChangeView={setViewMode}
        />

        <section className="lg:col-span-3">
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
              <div className="space-y-6">
                {/* Hero overview with stat cards */}
                <HeroOverview scan={selectedScan} />

                {/* Two-column layout for goals + activity */}
                {(selectedScan.projectMeta?.goals?.length || selectedScan.gitActivity || selectedScan.transcriptSummary) && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {selectedScan.projectMeta && <ProjectGoals meta={selectedScan.projectMeta} />}
                    <ActivityTimeline
                      git={selectedScan.gitActivity}
                      transcripts={selectedScan.transcriptSummary}
                    />
                  </div>
                )}

                {/* Capability map */}
                {selectedScan.capabilities && (
                  <CapabilityMap capabilities={selectedScan.capabilities} />
                )}

                {/* Entity lists */}
                <AgentsList agents={selectedScan.agents} />
                <SkillsList skills={selectedScan.skills} />
                <McpServersList servers={selectedScan.mcpServers} />

                {selectedScan.rules && selectedScan.rules.length > 0 && (
                  <RulesList rules={selectedScan.rules} />
                )}

                {/* Validation & Policy */}
                {selectedScan.validation && (
                  <ValidationPanel validation={selectedScan.validation} />
                )}
                {selectedScan.policy && (
                  <PolicyPanel policy={selectedScan.policy} />
                )}

                {/* Run history */}
                {selectedScan.runs && (
                  <RunsHistory runs={selectedScan.runs} />
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-[40vh]">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 0 0 3.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0 1 20.25 6v1.5m0 9V18A2.25 2.25 0 0 1 18 20.25h-1.5m-9 0H6A2.25 2.25 0 0 1 3.75 18v-1.5" />
                  </svg>
                </div>
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  Select a scan to view the full environment report
                </p>
                <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">
                  Run <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">openclaw-scan --token dev</code> to get started
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
