import React, { useEffect, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  Database,
  Download,
  Loader2,
  Play,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Terminal,
  XCircle,
} from 'lucide-react';
import type {
  BootstrapReport,
  RostrTraceSpan,
  SixthAgentBlueprint,
  VerificationSuiteReport,
} from '../types/monarch';

interface ExtendedConfigBundle {
  covenantMd: string;
  rostrConfigTs: string;
  systemPromptTxt: string;
  discoveryCard: Record<string, unknown>;
  mcpTools: Array<{ name: string; description: string; inputSchema: Record<string, unknown> }>;
  contextStats: { namespace: string; totalRecords: number; totalEpisodes: number };
  adkServices: {
    sdk: string;
    version: string;
    model: string;
    sessionService: string;
    artifactService: string;
    memoryService: string;
    agents: string[];
  };
  skillBundle: Record<string, string>;
}

interface HermesMemoryItem {
  id: string;
  kind: 'lesson' | 'synthesized-skill' | 'episode';
  title: string;
  summary: string;
  skillMarkdown?: string;
  tags: string[];
  status: 'pending-review' | 'promoted' | 'archived';
  createdAt: string;
}

interface CreativeDatasetPrior {
  id: string;
  hub: 'Hugging Face' | 'Kaggle';
  datasetName: string;
  focus: string;
  monarchApplication: string;
  priorRule: string;
}

interface HermesStateResponse {
  soulMd: string;
  datasetPriors: CreativeDatasetPrior[];
  memories: HermesMemoryItem[];
  stats: {
    totalMemories: number;
    promotedSkills: number;
    pendingReview: number;
    indexedDatasets: number;
  };
}

export const AgentInspectorView: React.FC = () => {
  const [bootstrap, setBootstrap] = useState<BootstrapReport | null>(null);
  const [config, setConfig] = useState<ExtendedConfigBundle | null>(null);
  const [traces, setTraces] = useState<RostrTraceSpan[]>([]);
  const [hermes, setHermes] = useState<HermesStateResponse | null>(null);
  const [verifyReport, setVerifyReport] = useState<VerificationSuiteReport | null>(null);
  const [scaffold, setScaffold] = useState<SixthAgentBlueprint | null>(null);

  const [activeDoc, setActiveDoc] = useState<string>('SKILL.md');
  const [copied, setCopied] = useState(false);

  const [verifyLoading, setVerifyLoading] = useState(false);
  const [reflectLoading, setReflectLoading] = useState(false);
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [scaffoldLoading, setScaffoldLoading] = useState(false);

  // Live Google ADK Orchestrator Chat state
  const [adkPrompt, setAdkPrompt] = useState(
    'Verify our video libraries, open-source datasets, and recommend the best render setup for a 24-second product launch film.'
  );
  const [adkResponse, setAdkResponse] = useState<{
    text: string;
    eventsCount: number;
    traceId: string;
    sessionId: string;
  } | null>(null);
  const [adkLoading, setAdkLoading] = useState(false);
  const [adkError, setAdkError] = useState<string | null>(null);

  // Live MCP 2026-07-28 RPC probe state
  const [mcpOutput, setMcpOutput] = useState<string>('');
  const [mcpLoading, setMcpLoading] = useState(false);

  const loadDiagnostics = async () => {
    try {
      const [bRes, cRes, tRes, hRes] = await Promise.all([
        fetch('/api/agent/bootstrap'),
        fetch('/api/agent/config'),
        fetch('/api/agent/traces'),
        fetch('/api/agent/hermes/state'),
      ]);
      if (bRes.ok) setBootstrap(await bRes.json());
      if (cRes.ok) setConfig(await cRes.json());
      if (tRes.ok) {
        const tJson = await tRes.json();
        setTraces(tJson.spans || []);
      }
      if (hRes.ok) setHermes(await hRes.json());
    } catch (err) {
      console.error('Failed to load agent diagnostics:', err);
    }
  };

  useEffect(() => {
    void loadDiagnostics();
  }, []);

  const runLiveVerification = async () => {
    setVerifyLoading(true);
    try {
      const res = await fetch('/api/agent/verify', { method: 'POST' });
      if (res.ok) {
        setVerifyReport(await res.json());
        void loadDiagnostics();
      }
    } finally {
      setVerifyLoading(false);
    }
  };

  const runHermesReflection = async () => {
    setReflectLoading(true);
    try {
      const res = await fetch('/api/agent/hermes/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        void loadDiagnostics();
      }
    } finally {
      setReflectLoading(false);
    }
  };

  const handlePromoteMemory = async (id: string, action: 'promoted' | 'archived') => {
    setPromotingId(id);
    try {
      const res = await fetch('/api/agent/hermes/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) {
        void loadDiagnostics();
      }
    } finally {
      setPromotingId(null);
    }
  };

  const handleGenerateScaffold = async () => {
    setScaffoldLoading(true);
    try {
      const res = await fetch('/api/agent/scaffold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Monarch Video Agent',
          domain: 'programmatic-video',
        }),
      });
      if (res.ok) {
        const blueprint = (await res.json()) as SixthAgentBlueprint;
        setScaffold(blueprint);
      }
    } finally {
      setScaffoldLoading(false);
    }
  };

  const downloadScaffoldJson = () => {
    if (!scaffold) return;
    const blob = new Blob([JSON.stringify(scaffold, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scaffold.slug}-rostr-scaffold.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const runAdkChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adkPrompt.trim() || adkLoading) return;
    setAdkLoading(true);
    setAdkError(null);
    try {
      const res = await fetch('/api/adk/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: adkPrompt, sessionId: 'inspector-session' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ADK invocation failed.');
      setAdkResponse(data);
      void loadDiagnostics();
    } catch (err) {
      setAdkError(err instanceof Error ? err.message : String(err));
    } finally {
      setAdkLoading(false);
    }
  };

  const runMcpProbe = async (method: 'initialize' | 'tools/list' | 'tools/call') => {
    setMcpLoading(true);
    try {
      const body =
        method === 'tools/call'
          ? {
              jsonrpc: '2.0',
              id: Date.now(),
              method: 'tools/call',
              params: {
                name: 'select_animations',
                arguments: { animationPreset: 'kinetic-editorial' },
              },
            }
          : { jsonrpc: '2.0', id: Date.now(), method };

      const res = await fetch('/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      setMcpOutput(JSON.stringify(json, null, 2));
      void loadDiagnostics();
    } finally {
      setMcpLoading(false);
    }
  };

  const docMap: Record<string, string> = {
    'SKILL.md': config?.skillBundle?.['SKILL.md'] || '',
    'SOUL.md': config?.skillBundle?.['SOUL.md'] || hermes?.soulMd || '',
    'references/creative-datasets.md': config?.skillBundle?.['references/creative-datasets.md'] || '',
    'references/openmontage-pipelines.md': config?.skillBundle?.['references/openmontage-pipelines.md'] || '',
    'references/timeline-schema.md': config?.skillBundle?.['references/timeline-schema.md'] || '',
    'scripts/bootstrap-env.sh': config?.skillBundle?.['scripts/bootstrap-env.sh'] || '',
    'covenant.md': config?.covenantMd || '',
    'rostr.config.ts': config?.rostrConfigTs || '',
    '.well-known/agent.json': config ? JSON.stringify(config.discoveryCard, null, 2) : '',
  };

  const activeContent = docMap[activeDoc] || '';

  const copyActiveDoc = async () => {
    await navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const downloadActiveDoc = () => {
    const blob = new Blob([activeContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeDoc.split('/').pop() || 'monarch-config.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Header Row */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs font-medium text-[#9A7B1C]">Developer Diagnostics · Live Runtime Verification</p>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-900">
            Agent Runtime, Self-Improvement & Skill Bundle
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Verify live Google ADK + ROSTR protocols, run the 9-check end-to-end test suite, inspect Hugging Face and
            Kaggle creative dataset priors, and promote Hermes synthesized skills.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={verifyLoading}
            onClick={() => void runLiveVerification()}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#102D69] px-3.5 text-xs font-semibold text-white transition-colors hover:bg-[#091A3E] disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            {verifyLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
            <span>{verifyLoading ? 'Verifying Stack...' : 'Run 9-Check Verification'}</span>
          </button>
          <button
            type="button"
            onClick={() => void loadDiagnostics()}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Live 9-Check Verification Report */}
      {verifyReport && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900">
                Live Verification Suite —{' '}
                <span className={verifyReport.overallPassed ? 'text-emerald-700' : 'text-amber-700'}>
                  {verifyReport.summary.passed}/{verifyReport.summary.total} Checks Passed
                </span>
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Executed {new Date(verifyReport.executedAt).toLocaleTimeString()} against live backend services.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {verifyReport.checks.map((chk) => (
              <div
                key={chk.id}
                className="rounded-lg border border-slate-200 bg-[#FAFBFD] p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {chk.passed ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0 text-red-600" />
                    )}
                    <span className="text-xs font-semibold text-slate-900">{chk.name}</span>
                  </div>
                  <span className="font-mono text-[10px] tabular-nums text-slate-500">
                    {chk.durationMs}ms
                  </span>
                </div>
                <p className="mt-1 font-mono text-[10px] text-[#102D69]">{chk.layer}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{chk.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Runtime Summary Metrics */}
      {config && bootstrap && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium text-slate-500">Google ADK Runtime</p>
            <p className="mt-1 font-display text-lg font-semibold text-slate-900">
              {config.adkServices.sdk}{' '}
              <span className="font-mono text-sm text-[#102D69] tabular-nums">
                v{config.adkServices.version}
              </span>
            </p>
            <div className="mt-3 space-y-1 text-xs text-slate-600">
              <p>Model: <span className="font-mono text-slate-800">{config.adkServices.model}</span></p>
              <p>Registered MCP Tools: <span className="font-mono tabular-nums text-slate-900">{config.mcpTools.length}</span></p>
              <p>Node CLI: {bootstrap.cliBinaries.node.available ? 'Available' : 'Missing'} · FFmpeg: {bootstrap.cliBinaries.ffmpeg.available ? 'Available' : 'Browser WebM Fallback'}</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium text-slate-500">ROSTR Open Protocols</p>
            <p className="mt-1 font-display text-lg font-semibold text-slate-900">
              MCP {bootstrap.protocolVersions.mcp} · ACP {bootstrap.protocolVersions.acp}
            </p>
            <div className="mt-3 space-y-1 text-xs text-slate-600">
              <p>Context Engine Records: <span className="font-mono tabular-nums text-slate-900">{config.contextStats.totalRecords}</span></p>
              <p>Episodic Relearning Runs: <span className="font-mono tabular-nums text-slate-900">{config.contextStats.totalEpisodes}</span></p>
              <p>Indexed HF/Kaggle Datasets: <span className="font-mono tabular-nums text-slate-900">{hermes?.stats.indexedDatasets ?? 8}</span></p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-[#102D69]">6th-Agent Portable Scaffold</span>
              <button
                type="button"
                disabled={scaffoldLoading}
                onClick={() => void handleGenerateScaffold()}
                className="inline-flex h-7 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
              >
                {scaffoldLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 text-[#D4AF37]" />}
                <span>Compile Scaffold</span>
              </button>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Generate a standalone ROSTR agent bundle (covenant, MCP server, worker config, and tools) for Vercel or Cloudflare deployment.
            </p>
            {scaffold && (
              <div className="mt-3 flex items-center justify-between rounded-lg bg-[#FAFBFD] px-3 py-2 text-xs">
                <span className="font-mono text-slate-700">
                  {Object.keys(scaffold.files).length} files ready
                </span>
                <button
                  type="button"
                  onClick={downloadScaffoldJson}
                  className="inline-flex items-center gap-1 font-medium text-[#102D69] hover:underline"
                >
                  <Download className="h-3 w-3" />
                  <span>Download JSON</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hermes Self-Improving Loop & Hugging Face / Kaggle Creative Datasets */}
      {hermes && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-base font-semibold text-slate-900">
                  Hermes Self-Improving Memory Loop
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Reflects on recent traces and synthesizes reusable creative skills with human-gated promotion.
                </p>
              </div>
              <button
                type="button"
                disabled={reflectLoading}
                onClick={() => void runHermesReflection()}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#102D69] px-3 text-xs font-medium text-white hover:bg-[#091A3E] disabled:opacity-60 whitespace-nowrap shrink-0"
              >
                {reflectLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />}
                <span>Run Reflection</span>
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {hermes.memories.map((mem) => (
                <div key={mem.id} className="rounded-lg border border-slate-200 bg-[#FAFBFD] p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-wide text-[#9A7B1C]">
                        {mem.kind} · {mem.status}
                      </span>
                      <h4 className="mt-0.5 text-sm font-semibold text-slate-900">{mem.title}</h4>
                    </div>
                    {mem.status === 'pending-review' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={promotingId === mem.id}
                          onClick={() => void handlePromoteMemory(mem.id, 'promoted')}
                          className="rounded-md bg-[#102D69] px-2.5 py-1 text-[11px] font-medium text-white hover:bg-[#091A3E]"
                        >
                          Promote
                        </button>
                        <button
                          type="button"
                          disabled={promotingId === mem.id}
                          onClick={() => void handlePromoteMemory(mem.id, 'archived')}
                          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                        >
                          Archive
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{mem.summary}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-base font-semibold text-slate-900">
                  Hugging Face & Kaggle Creative Priors
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Pinned directly into the Context Engine to strengthen storyboarding, camera choreography, and easing.
                </p>
              </div>
              <Database className="h-4 w-4 text-[#102D69]" />
            </div>

            <div className="mt-4 max-h-80 divide-y divide-slate-100 overflow-y-auto pr-1">
              {hermes.datasetPriors.map((ds) => (
                <div key={ds.id} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-900">{ds.datasetName}</span>
                    <span className="font-mono text-[10px] text-[#9A7B1C]">{ds.hub}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {ds.focus} · Tool: <code className="font-mono text-slate-700">{ds.monarchApplication}</code>
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{ds.priorRule}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Live Google ADK Runner Test & MCP JSON-RPC Console */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-display text-base font-semibold text-slate-900">
            Test Google ADK Orchestrator
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Runs <code className="font-mono">Runner.runAsync</code> with all registered Zod tools and ADK memory.
          </p>
          <form onSubmit={runAdkChat} className="mt-4 space-y-3">
            <textarea
              rows={3}
              value={adkPrompt}
              onChange={(e) => setAdkPrompt(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-[#FAFBFD] px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#102D69]"
            />
            <button
              type="submit"
              disabled={adkLoading}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#102D69] px-4 text-xs font-medium text-white transition-colors hover:bg-[#091A3E] disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{adkLoading ? 'Running ADK Agent...' : 'Run ADK Agent'}</span>
            </button>
          </form>

          {adkError && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {adkError}
            </div>
          )}

          {adkResponse && (
            <div className="mt-4 rounded-lg border border-slate-200 bg-[#FAFBFD] p-4">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Session {adkResponse.sessionId} · {adkResponse.eventsCount} events</span>
                <span className="font-mono tabular-nums">Trace {adkResponse.traceId.slice(0, 10)}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-800">
                {adkResponse.text}
              </p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900">
                Stateless MCP 2026-07-28 Probe
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Invoke live JSON-RPC 2.0 requests against <code className="font-mono">POST /mcp</code>.
              </p>
            </div>
            <Terminal className="h-4 w-4 text-slate-400" />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={mcpLoading}
              onClick={() => void runMcpProbe('initialize')}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              <Play className="h-3 w-3 text-[#102D69]" />
              <span>initialize</span>
            </button>
            <button
              type="button"
              disabled={mcpLoading}
              onClick={() => void runMcpProbe('tools/list')}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              <Play className="h-3 w-3 text-[#102D69]" />
              <span>tools/list</span>
            </button>
            <button
              type="button"
              disabled={mcpLoading}
              onClick={() => void runMcpProbe('tools/call')}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              <Play className="h-3 w-3 text-[#102D69]" />
              <span>call select_animations</span>
            </button>
          </div>

          <pre className="mt-4 max-h-56 overflow-auto rounded-lg bg-[#09142B] p-4 font-mono text-[11px] leading-relaxed text-slate-200">
            {mcpOutput || 'Click a JSON-RPC method above to inspect the live MCP response.'}
          </pre>
        </div>
      </div>

      {/* Bundled Skill Package & ROSTR Configuration Viewer */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-semibold text-slate-900">
              Bundled <code className="font-mono text-sm">monarch-video</code> Skill & Configs
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Inspect or download the complete skill markdown, SOUL charter, dataset references, and agent manifest.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void copyActiveDoc()}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              type="button"
              onClick={downloadActiveDoc}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#102D69] px-3 text-xs font-medium text-white hover:bg-[#091A3E] whitespace-nowrap shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
          {Object.keys(docMap).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveDoc(key)}
              className={`rounded-md px-2.5 py-1.5 font-mono text-[11px] transition-colors whitespace-nowrap shrink-0 ${
                activeDoc === key
                  ? 'bg-white font-medium text-[#102D69] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {key}
            </button>
          ))}
        </div>

        <pre className="mt-4 max-h-72 overflow-auto rounded-lg bg-[#09142B] p-4 font-mono text-xs leading-relaxed text-slate-200">
          {activeContent || 'Loading skill bundle...'}
        </pre>
      </div>

      {/* Live Execution Traces */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="font-display text-base font-semibold text-slate-900">
          Recent Execution Traces
        </h3>
        <p className="mt-0.5 text-xs text-slate-500">
          OpenTelemetry-compatible spans recorded from live studio runs, voiceover calls, and MCP requests.
        </p>

        {traces.length === 0 ? (
          <p className="mt-4 text-xs text-slate-500">
            No traces recorded yet. Run a verification check or create a video to inspect live spans.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-4 font-medium">Span</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Trace ID</th>
                  <th className="py-2 pr-4 text-right font-medium">Duration</th>
                  <th className="py-2 text-right font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {traces.slice(0, 12).map((span) => (
                  <tr key={span.spanId} className="hover:bg-slate-50/60">
                    <td className="py-2.5 pr-4 font-mono text-slate-800">{span.name}</td>
                    <td className="py-2.5 pr-4 font-medium text-slate-700">{span.status}</td>
                    <td className="py-2.5 pr-4 font-mono text-slate-500">{span.traceId.slice(0, 12)}</td>
                    <td className="py-2.5 pr-4 text-right font-mono tabular-nums text-slate-700">
                      {span.durationMs} ms
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums text-slate-500">
                      {new Date(span.startedAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
