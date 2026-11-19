import React, { useEffect, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  Database,
  Download,
  ExternalLink,
  Layers,
  Loader2,
  Play,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Terminal,
  Wrench,
  XCircle,
} from 'lucide-react';
import type {
  BootstrapReport,
  MonarchMasterManifest,
  RostrTraceSpan,
  SixthAgentBlueprint,
  VerificationSuiteReport,
} from '../types/monarch';

interface ExtendedConfigBundle {
  soulMd: string;
  covenantMd: string;
  rostrConfigTs: string;
  systemPromptTxt: string;
  masterManifest: MonarchMasterManifest;
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

  const [hubSection, setHubSection] = useState<
    'one-sheeter' | 'subagents' | 'tools-skills' | 'references' | 'hermes-verify'
  >('one-sheeter');
  const [activeDoc, setActiveDoc] = useState<string>('agent/manifest/MASTER_ONE_SHEETER.md');
  const [copied, setCopied] = useState(false);

  const [verifyLoading, setVerifyLoading] = useState(false);
  const [reflectLoading, setReflectLoading] = useState(false);
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [scaffoldLoading, setScaffoldLoading] = useState(false);

  // Live Tool Invoker state (test any of the 16 ADK/MCP tools)
  const [selectedToolName, setSelectedToolName] = useState<string>('harvest_broll_montage');
  const [toolOutput, setToolOutput] = useState<string>('');
  const [toolLoading, setToolLoading] = useState(false);

  // Live Google ADK Orchestrator Chat state
  const [adkPrompt, setAdkPrompt] = useState(
    'Verify our 7 sub-agents, 16 tools, SOUL.md covenant, and recommend the sharpest B-roll montage cadence for a 24-second product launch film.'
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

  const downloadMasterBundleJson = () => {
    if (!config?.masterManifest) return;
    const blob = new Blob([JSON.stringify(config.masterManifest, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'monarch-video-master-soul-covenant-manifest.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const invokeLiveTool = async (toolName: string) => {
    setToolLoading(true);
    setSelectedToolName(toolName);
    try {
      const res = await fetch(`/api/studio/tool/${toolName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Monarch B-Roll Montage Launch Film',
          query: 'hardware',
          durationSec: 6,
        }),
      });
      const data = await res.json();
      setToolOutput(JSON.stringify(data, null, 2));
      void loadDiagnostics();
    } finally {
      setToolLoading(false);
    }
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
                name: 'harvest_broll_montage',
                arguments: { sceneId: 'scene-1', durationSec: 6, title: 'Hardware Reveal' },
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

  const manifest = config?.masterManifest;

  const docMap: Record<string, string> = {
    'agent/manifest/MASTER_ONE_SHEETER.md':
      config?.skillBundle?.['agent/manifest/MASTER_ONE_SHEETER.md'] ||
      manifest?.masterOneSheeterMd ||
      '',
    'agent/manifest/SOUL.md':
      config?.skillBundle?.['agent/manifest/SOUL.md'] || manifest?.soulMd || config?.soulMd || '',
    'agent/manifest/COVENANT.md':
      config?.skillBundle?.['agent/manifest/COVENANT.md'] ||
      manifest?.covenantMd ||
      config?.covenantMd ||
      '',
    'SYSTEM_INSTRUCTIONS.md': manifest?.systemInstructionsMd || config?.systemPromptTxt || '',
    'ORCHESTRATION_WORKFLOWS.md': manifest?.orchestrationWorkflowsMd || '',
    'REFERENCE_MANIFEST.md': manifest?.referenceManifestMd || '',
    'SKILL.md': config?.skillBundle?.['SKILL.md'] || '',
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
    a.download = activeDoc.split('/').pop() || 'monarch-manifest.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs font-medium text-[#9A7B1C]">
            Master Agent Governance · Base Repo: github.com/diamitani/monarch-video
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-900">
            Master Agent Soul, Covenant & 7-Sub-Agent Architecture Hub
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            Inspect the canonical <code className="font-mono text-xs">SOUL.md</code>,{' '}
            <code className="font-mono text-xs">COVENANT.md</code>, Master One-Sheeter, 7 Google ADK Sub-Agents, 16
            deterministic MCP tools, step-by-step workflows, and run the 12-point infallibility verification suite.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={verifyLoading}
            onClick={() => void runLiveVerification()}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#102D69] px-3.5 text-xs font-semibold text-white transition-colors hover:bg-[#091A3E] disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            {verifyLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ShieldCheck className="h-3.5 w-3.5 text-[#D4AF37]" />
            )}
            <span>{verifyLoading ? 'Auditing 12 Points...' : 'Run 12-Point Infallibility Audit'}</span>
          </button>
          <button
            type="button"
            onClick={downloadMasterBundleJson}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Master Bundle</span>
          </button>
          <button
            type="button"
            onClick={() => void loadDiagnostics()}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Live 12-Point Infallibility Verification Report */}
      {verifyReport && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900">
                12-Point Infallibility Verification Suite —{' '}
                <span className={verifyReport.overallPassed ? 'text-emerald-700' : 'text-amber-700'}>
                  {verifyReport.summary.passed}/{verifyReport.summary.total} Checks Passed
                </span>
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Executed {new Date(verifyReport.executedAt).toLocaleTimeString()} across SOUL.md, COVENANT.md, 7
                Sub-Agents, 16 MCP Tools, FFmpeg MP4 Render, and Gemini 3.8 TTS.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {verifyReport.checks.map((chk) => (
              <div key={chk.id} className="rounded-lg border border-slate-200 bg-[#FAFBFD] p-3">
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

      {/* Sub-Navigation Bar for Master Architecture Hub */}
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
        {[
          { id: 'one-sheeter', label: '1. Master One-Sheeter · SOUL.md · COVENANT.md' },
          { id: 'subagents', label: '2. 7 Sub-Agents & Orchestration Workflows' },
          { id: 'tools-skills', label: '3. 16 Registered Tools & 7 Skills' },
          { id: 'references', label: '4. Canonical Reference & Dataset Registry' },
          { id: 'hermes-verify', label: '5. Hermes Loop · ADK Runner · Live Traces' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setHubSection(tab.id as typeof hubSection)}
            className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              hubSection === tab.id
                ? 'bg-white text-[#102D69] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SECTION 1: MASTER ONE-SHEETER, SOUL.md & COVENANT.md */}
      {hubSection === 'one-sheeter' && (
        <div className="space-y-6">
          {config && bootstrap && (
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium text-slate-500">Sub-Agent Hierarchy</p>
                <p className="mt-1 font-display text-xl font-bold text-slate-900 tabular-nums">
                  {manifest?.subAgents.length || 7} Sub-Agents
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Google ADK v{config.adkServices.version} + Open ACP 1.0
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium text-slate-500">Deterministic Tool Surface</p>
                <p className="mt-1 font-display text-xl font-bold text-slate-900 tabular-nums">
                  {manifest?.registeredTools.length || 16} ADK + MCP Tools
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Stateless MCP {bootstrap.protocolVersions.mcp} · Composio Enforced
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium text-slate-500">ContextEngine & Datasets</p>
                <p className="mt-1 font-display text-xl font-bold text-slate-900 tabular-nums">
                  {config.contextStats.totalRecords} Pinned Records
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  {hermes?.stats.indexedDatasets ?? 8} HF/Kaggle Priors · {config.contextStats.totalEpisodes} Episodes
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium text-slate-500">Video & MP4 Engines</p>
                <p className="mt-1 font-display text-xl font-bold text-slate-900">
                  FFmpeg + HyperFrames
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  H.264 MP4 ({bootstrap.cliBinaries.ffmpeg.available ? 'Active' : 'Ready'}) · OpenMontage · Remotion
                </p>
              </div>
            </div>
          )}

          {/* Canonical Document Viewer */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-base font-semibold text-slate-900">
                  Canonical Master Agent Documents (<code className="font-mono text-sm">SOUL.md</code> ·{' '}
                  <code className="font-mono text-sm">COVENANT.md</code> ·{' '}
                  <code className="font-mono text-sm">MASTER_ONE_SHEETER.md</code>)
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Compiled directly into the live runtime and persisted on disk in{' '}
                  <code className="font-mono">/agent/manifest/</code> and{' '}
                  <code className="font-mono">/skills/monarch-video/</code>.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void copyActiveDoc()}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Document'}</span>
                </button>
                <button
                  type="button"
                  onClick={downloadActiveDoc}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#102D69] px-3 text-xs font-medium text-white hover:bg-[#091A3E] whitespace-nowrap shrink-0"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download .md</span>
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
                      ? 'bg-white font-semibold text-[#102D69] shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>

            <pre className="mt-4 max-h-[480px] overflow-auto rounded-lg bg-[#09142B] p-5 font-mono text-xs leading-relaxed text-slate-100">
              {activeContent || 'Loading master document...'}
            </pre>
          </div>
        </div>
      )}

      {/* SECTION 2: 7 SUB-AGENTS & STEP-BY-STEP WORKFLOWS */}
      {hubSection === 'subagents' && manifest && (
        <div className="space-y-4">
          {manifest.subAgents.map((agent, idx) => (
            <div key={agent.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono font-semibold text-[#102D69]">
                      0{idx + 1}. {agent.id}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{agent.layer}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-[#9A7B1C]">{agent.model}</span>
                  </div>
                  <h3 className="mt-1 font-display text-lg font-bold text-slate-900">
                    {agent.name} — {agent.role}
                  </h3>
                </div>
                <div className="text-right font-mono text-[11px] text-slate-500">
                  <div>{agent.tools.length} Tools Bound</div>
                  <div>{agent.skills.length} Skills Active</div>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-1 space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">System Instruction</p>
                    <p className="mt-1 rounded-lg bg-[#FAFBFD] p-3 text-xs leading-relaxed text-slate-600 border border-slate-200">
                      {agent.systemInstruction}
                    </p>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p>
                      <strong className="text-slate-800">Input Contract:</strong>{' '}
                      <code className="font-mono text-[11px] text-[#102D69]">{agent.inputContract}</code>
                    </p>
                    <p>
                      <strong className="text-slate-800">Output Contract:</strong>{' '}
                      <code className="font-mono text-[11px] text-[#102D69]">{agent.outputContract}</code>
                    </p>
                    <p>
                      <strong className="text-slate-800">Tools:</strong>{' '}
                      <span className="font-mono text-[11px] text-slate-700">{agent.tools.join(', ')}</span>
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <p className="text-xs font-semibold text-slate-800">
                    Deterministic Workflow Steps & Verification Gates
                  </p>
                  <div className="mt-2 grid gap-2.5 sm:grid-cols-3">
                    {agent.workflowSteps.map((wf) => (
                      <div
                        key={wf.step}
                        className="rounded-lg border border-slate-200 bg-[#FAFBFD] p-3 flex flex-col justify-between"
                      >
                        <div>
                          <span className="font-mono text-[10px] font-semibold text-[#9A7B1C]">
                            STEP 0{wf.step} · {wf.phase}
                          </span>
                          <p className="mt-1 text-xs leading-relaxed text-slate-800">{wf.action}</p>
                        </div>
                        <div className="mt-3 border-t border-slate-200/80 pt-2">
                          <span className="block font-mono text-[10px] text-emerald-700">
                            Gate: {wf.verificationGate}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SECTION 3: 16 REGISTERED TOOLS & 7 SKILLS + LIVE INVOKER */}
      {hubSection === 'tools-skills' && manifest && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-base font-semibold text-slate-900">
                    16 Deterministic Tools (Google ADK <code className="font-mono text-xs">FunctionTool</code> +
                    MCP <code className="font-mono text-xs">2026-07-28</code>)
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Click any tool row to test it live against the backend runtime.
                  </p>
                </div>
                <Wrench className="h-4 w-4 text-[#102D69]" />
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {manifest.registeredTools.map((tool, idx) => (
                  <button
                    key={tool.name}
                    type="button"
                    onClick={() => void invokeLiveTool(tool.name)}
                    className={`flex flex-col items-start rounded-lg border p-3 text-left transition-colors ${
                      selectedToolName === tool.name
                        ? 'border-[#102D69] bg-[#EEF3FA]'
                        : 'border-slate-200 bg-[#FAFBFD] hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-[#102D69]">
                        {String(idx + 1).padStart(2, '0')}. {tool.name}
                      </span>
                      <span className="font-mono text-[10px] text-[#9A7B1C]">{tool.category}</span>
                    </div>
                    <p className="mt-1 text-xs leading-snug text-slate-600">{tool.description}</p>
                    <span className="mt-1.5 font-mono text-[10px] text-slate-500">
                      Owner: {tool.subAgentOwner}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-base font-semibold text-slate-900">
                    Live Tool Execution Output
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Active tool: <code className="font-mono text-[#102D69]">{selectedToolName}</code>
                  </p>
                </div>
                <button
                  type="button"
                  disabled={toolLoading}
                  onClick={() => void invokeLiveTool(selectedToolName)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#102D69] px-3 text-xs font-medium text-white hover:bg-[#091A3E] disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  {toolLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                  <span>Invoke</span>
                </button>
              </div>
              <pre className="mt-4 max-h-[520px] overflow-auto rounded-lg bg-[#09142B] p-4 font-mono text-[11px] leading-relaxed text-slate-200">
                {toolOutput || 'Select any of the 16 tools on the left to execute it live and inspect the JSON response.'}
              </pre>
            </div>
          </div>

          {/* 7 Strengthened Skills Registry */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-semibold text-slate-900">
                  7 Production Agent Skills & Infallibility Contracts
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Modular TypeScript skill implementations backing the 7 sub-agents.
                </p>
              </div>
              <Layers className="h-4 w-4 text-[#102D69]" />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {manifest.skills.map((skill) => (
                <div key={skill.id} className="rounded-lg border border-slate-200 bg-[#FAFBFD] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-sm font-bold text-slate-900">{skill.name}</span>
                    <code className="font-mono text-[11px] text-[#102D69]">{skill.modulePath}</code>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{skill.purpose}</p>
                  <div className="mt-2.5 space-y-1 text-xs text-slate-700">
                    {skill.workflowSteps.map((st, i) => (
                      <p key={i}>
                        <span className="font-mono text-[11px] text-[#9A7B1C]">0{i + 1}.</span> {st}
                      </p>
                    ))}
                  </div>
                  <div className="mt-3 border-t border-slate-200 pt-2 font-mono text-[10px] text-emerald-700">
                    Infallibility Contract: {skill.infallibilityCheck}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: CANONICAL REFERENCE & DATASET REGISTRY */}
      {hubSection === 'references' && manifest && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-display text-base font-semibold text-slate-900">
              Canonical Reference Repositories, Open-Source Video Engines & Protocols
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Grounded in <code className="font-mono">https://github.com/diamitani/monarch-video</code>, Loom
              walkthrough, HyperFrames, OpenMontage, Remotion, Google ADK, and Composio media hubs.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {manifest.references.map((ref) => (
                <div key={ref.id} className="rounded-lg border border-slate-200 bg-[#FAFBFD] p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#9A7B1C]">
                        {ref.category} · {ref.license}
                      </span>
                      <h4 className="mt-0.5 font-display text-sm font-semibold text-slate-900">
                        {ref.title}
                      </h4>
                    </div>
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#102D69] hover:underline whitespace-nowrap shrink-0"
                    >
                      <span>Open</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-slate-500 break-all">{ref.url}</p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">{ref.integrationRole}</p>
                </div>
              ))}
            </div>
          </div>

          {hermes && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="font-display text-base font-semibold text-slate-900">
                    Hugging Face & Kaggle Creative Video Dataset Priors
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Seeded into ROSTR Layer 1 <code className="font-mono">ContextEngine</code> for camera framing,
                    montage cut rhythm, and GSAP easing.
                  </p>
                </div>
                <Database className="h-4 w-4 text-[#102D69]" />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {hermes.datasetPriors.map((ds) => (
                  <div key={ds.id} className="rounded-lg border border-slate-200 bg-[#FAFBFD] p-3.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-900">{ds.datasetName}</span>
                      <span className="font-mono text-[10px] text-[#9A7B1C]">{ds.hub}</span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {ds.focus} · Tool: <code className="font-mono text-slate-700">{ds.monarchApplication}</code>
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{ds.priorRule}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 5: HERMES SELF-IMPROVING LOOP, ADK RUNNER, MCP PROBE & LIVE TRACES */}
      {hubSection === 'hermes-verify' && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Hermes Self-Improving Loop */}
            {hermes && (
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display text-base font-semibold text-slate-900">
                      Hermes Self-Improving Memory Loop
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Synthesizes reusable creative skills and adapts Cinema Style Blueprints from creator feedback.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={reflectLoading}
                    onClick={() => void runHermesReflection()}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#102D69] px-3 text-xs font-medium text-white hover:bg-[#091A3E] disabled:opacity-60 whitespace-nowrap shrink-0"
                  >
                    {reflectLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
                    )}
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
            )}

            {/* 6th-Agent Portable Scaffold + Stateless MCP Probe */}
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display text-base font-semibold text-slate-900">
                      Stateless MCP 2026-07-28 Probe
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Invoke live JSON-RPC 2.0 requests against <code className="font-mono">POST /mcp</code>.
                    </p>
                  </div>
                  <Terminal className="h-4 w-4 text-slate-400" />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
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
                    <span>tools/list (16 tools)</span>
                  </button>
                  <button
                    type="button"
                    disabled={mcpLoading}
                    onClick={() => void runMcpProbe('tools/call')}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
                  >
                    <Play className="h-3 w-3 text-[#102D69]" />
                    <span>call harvest_broll_montage</span>
                  </button>
                  <button
                    type="button"
                    disabled={scaffoldLoading}
                    onClick={() => void handleGenerateScaffold()}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
                  >
                    <Sparkles className="h-3 w-3 text-[#D4AF37]" />
                    <span>Compile 6th-Agent Scaffold</span>
                  </button>
                </div>

                {scaffold && (
                  <div className="mt-3 rounded-lg bg-[#FAFBFD] p-2.5 text-xs text-slate-700 border border-slate-200">
                    Compiled portable scaffold <strong className="font-mono">{scaffold.slug}</strong> with{' '}
                    {Object.keys(scaffold.files).length} files ({Object.keys(scaffold.files).join(', ')}).
                  </div>
                )}

                <pre className="mt-3 max-h-48 overflow-auto rounded-lg bg-[#09142B] p-4 font-mono text-[11px] leading-relaxed text-slate-200">
                  {mcpOutput || 'Click a JSON-RPC method above to inspect the live MCP response.'}
                </pre>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="font-display text-base font-semibold text-slate-900">
                  Test Google ADK 7-Sub-Agent Orchestrator
                </h3>
                <form onSubmit={runAdkChat} className="mt-3 space-y-3">
                  <textarea
                    rows={2}
                    value={adkPrompt}
                    onChange={(e) => setAdkPrompt(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-[#FAFBFD] px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#102D69]"
                  />
                  <button
                    type="submit"
                    disabled={adkLoading}
                    className="inline-flex h-8 items-center gap-2 rounded-lg bg-[#102D69] px-3.5 text-xs font-medium text-white transition-colors hover:bg-[#091A3E] disabled:opacity-60 whitespace-nowrap shrink-0"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{adkLoading ? 'Running ADK Agent...' : 'Run ADK Orchestrator'}</span>
                  </button>
                </form>

                {adkError && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {adkError}
                  </div>
                )}

                {adkResponse && (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-[#FAFBFD] p-3.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>
                        Session {adkResponse.sessionId} · {adkResponse.eventsCount} events
                      </span>
                      <span className="font-mono tabular-nums">Trace {adkResponse.traceId.slice(0, 10)}</span>
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed text-slate-800">
                      {adkResponse.text}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Live Execution Traces */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-display text-base font-semibold text-slate-900">
              Recent OpenTelemetry Execution Traces
            </h3>
            {traces.length === 0 ? (
              <p className="mt-3 text-xs text-slate-500">
                No traces recorded yet. Run the 12-point verification audit or invoke a tool above.
              </p>
            ) : (
              <div className="mt-3 overflow-x-auto">
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
                        <td className="py-2 pr-4 font-mono text-slate-800">{span.name}</td>
                        <td className="py-2 pr-4 font-medium text-slate-700">{span.status}</td>
                        <td className="py-2 pr-4 font-mono text-slate-500">{span.traceId.slice(0, 12)}</td>
                        <td className="py-2 pr-4 text-right font-mono tabular-nums text-slate-700">
                          {span.durationMs} ms
                        </td>
                        <td className="py-2 text-right font-mono tabular-nums text-slate-500">
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
      )}
    </div>
  );
};
