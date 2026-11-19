import React, { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Play,
  RefreshCw,
  Send,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import type { BootstrapReport, RostrTraceSpan } from '../types/monarch';

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

export const AgentInspectorView: React.FC = () => {
  const [bootstrap, setBootstrap] = useState<BootstrapReport | null>(null);
  const [config, setConfig] = useState<ExtendedConfigBundle | null>(null);
  const [traces, setTraces] = useState<RostrTraceSpan[]>([]);
  const [activeDoc, setActiveDoc] = useState<string>('SKILL.md');
  const [copied, setCopied] = useState(false);

  // Live Google ADK Orchestrator Chat state
  const [adkPrompt, setAdkPrompt] = useState(
    'Verify the programmatic video libraries and recommend a render runtime for a 30-second product launch reel.'
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
      const [bRes, cRes, tRes] = await Promise.all([
        fetch('/api/agent/bootstrap'),
        fetch('/api/agent/config'),
        fetch('/api/agent/traces'),
      ]);
      if (bRes.ok) setBootstrap(await bRes.json());
      if (cRes.ok) setConfig(await cRes.json());
      if (tRes.ok) {
        const tJson = await tRes.json();
        setTraces(tJson.spans || []);
      }
    } catch (err) {
      console.error('Failed to load agent diagnostics:', err);
    }
  };

  useEffect(() => {
    void loadDiagnostics();
  }, []);

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
                name: 'composio_runtime_route',
                arguments: { prompt: 'Cinematic 30s luxury product film with Veo 3.1' },
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
    'scripts/bootstrap-env.sh': config?.skillBundle?.['scripts/bootstrap-env.sh'] || '',
    'references/timeline-schema.md': config?.skillBundle?.['references/timeline-schema.md'] || '',
    'covenant.md': config?.covenantMd || '',
    'rostr.config.ts': config?.rostrConfigTs || '',
    'system_prompt.txt': config?.systemPromptTxt || '',
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
          <p className="text-xs font-medium text-[#9A7B1C]">Google ADK · ROSTR 6-Layer Stack</p>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-900">
            Backend Agent Infrastructure & Skill Bundle
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Inspect the live Google ADK orchestrator, bundled <code className="text-xs">monarch-video</code> skill files,
            2026 provider guardrails, and stateless MCP/ACP open-protocol endpoints.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadDiagnostics()}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Runtime</span>
        </button>
      </div>

      {/* Google ADK Services & Context Substrate Metrics */}
      {config && bootstrap && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium text-slate-500">Google ADK Runtime</p>
            <p className="mt-1 font-display text-lg font-semibold text-slate-900">
              {config.adkServices.sdk} <span className="font-mono text-sm text-[#102D69] tabular-nums">v{config.adkServices.version}</span>
            </p>
            <div className="mt-3 space-y-1 text-xs text-slate-600">
              <p>Model: <span className="font-mono text-slate-800">{config.adkServices.model}</span></p>
              <p>Sessions: {config.adkServices.sessionService}</p>
              <p>Artifacts: {config.adkServices.artifactService}</p>
              <p>Memory: {config.adkServices.memoryService}</p>
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
              <p>Composio MCP Servers: <span className="font-mono tabular-nums text-slate-900">{bootstrap.composioMcpServers.length}</span></p>
              <p>Node Runtime: <span className="font-mono tabular-nums text-slate-900">{bootstrap.nodeVersion}</span></p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 text-xs font-medium text-[#102D69]">
              <ShieldCheck className="h-4 w-4 text-[#D4AF37]" />
              <span>Active 2026 Guardrails</span>
            </div>
            <ul className="mt-2.5 space-y-1.5 text-xs leading-relaxed text-slate-600">
              {bootstrap.guardrailsActive.slice(0, 4).map((g) => (
                <li key={g} className="truncate" title={g}>
                  · {g}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Programmatic Video Libraries & Model Adapters Table */}
      {bootstrap && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-display text-base font-semibold text-slate-900">
              Sub-Skill A: Programmatic Video Engines
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Auto-selected at proposal time via <code className="font-mono">video-env-bootstrap</code>.
            </p>
            <div className="mt-4 divide-y divide-slate-100">
              {bootstrap.programmaticLibraries.map((lib) => (
                <div key={lib.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-900">{lib.name}</span>
                    <span className="text-xs text-slate-500">
                      {lib.license} · {lib.status === 'guarded' ? 'License Check Active' : 'Ready'}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600">{lib.role}</p>
                  {lib.guardrailNote && (
                    <p className="mt-1 text-xs text-[#9A7B1C]">{lib.guardrailNote}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-display text-base font-semibold text-slate-900">
              Server-Side BYOK & AI Gateway Model Adapters
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Keys stay strictly in server environment variables; browser clients never see raw secrets.
            </p>
            <div className="mt-4 divide-y divide-slate-100">
              {bootstrap.modelAdapters.map((adapter) => (
                <div key={adapter.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-900">{adapter.provider}</span>
                    <span
                      className={`text-xs font-medium ${
                        adapter.configuredOnServer ? 'text-[#16A34A]' : 'text-slate-500'
                      }`}
                    >
                      {adapter.configuredOnServer ? 'Server Key Active' : 'Gateway Routable'}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600">{adapter.role}</p>
                  <p className="mt-1 font-mono text-[11px] text-slate-500">
                    {adapter.activeModels.join(' · ')}
                  </p>
                  {adapter.guardrailNote && (
                    <p className="mt-1 text-xs text-[#9A7B1C]">{adapter.guardrailNote}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Live Google ADK Runner Test & MCP JSON-RPC Console */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Live ADK Runner */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-display text-base font-semibold text-slate-900">
            Test Google ADK Orchestrator (<code className="font-mono text-xs">monarch_video_orchestrator</code>)
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Executes <code className="font-mono">Runner.runAsync</code> with Zod <code className="font-mono">FunctionTool</code>s
            and stores the session in ADK <code className="font-mono">MemoryService</code>.
          </p>
          <form onSubmit={runAdkChat} className="mt-4 space-y-3">
            <textarea
              rows={3}
              value={adkPrompt}
              onChange={(e) => setAdkPrompt(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-[#FAFBFD] px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#102D69]"
              placeholder="Ask the Monarch ADK orchestrator to evaluate libraries, guardrails, or brand memory..."
            />
            <button
              type="submit"
              disabled={adkLoading}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#102D69] px-4 text-xs font-medium text-white transition-colors hover:bg-[#091A3E] disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{adkLoading ? 'Running ADK Runner...' : 'Run ADK Agent'}</span>
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
                <span>Session {adkResponse.sessionId} · {adkResponse.eventsCount} ADK events</span>
                <span className="font-mono tabular-nums">Trace {adkResponse.traceId.slice(0, 10)}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-800">
                {adkResponse.text}
              </p>
            </div>
          )}
        </div>

        {/* Live MCP 2026-07-28 Probe */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900">
                Stateless MCP 2026-07-28 Probe (<code className="font-mono text-xs">POST /mcp</code>)
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Invoke live JSON-RPC 2.0 calls against the ROSTR MCP server.
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
              <span>call composio_runtime_route</span>
            </button>
          </div>

          <pre className="mt-4 max-h-56 overflow-auto rounded-lg bg-[#09142B] p-4 font-mono text-[11px] leading-relaxed text-slate-200">
            {mcpOutput || '// Click a JSON-RPC method above to inspect the live stateless MCP response.'}
          </pre>
        </div>
      </div>

      {/* Bundled Skill Package & ROSTR Configuration Viewer */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-semibold text-slate-900">
              Bundled <code className="font-mono text-sm">monarch-video</code> Skill & ROSTR Configs
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Plug-and-play skill files, bootstrap script, canonical timeline schema, and agent discovery manifest.
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
              className={`rounded-md px-3 py-1.5 font-mono text-xs transition-colors whitespace-nowrap shrink-0 ${
                activeDoc === key
                  ? 'bg-white font-medium text-[#102D69] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {key}
            </button>
          ))}
        </div>

        <pre className="mt-4 max-h-80 overflow-auto rounded-lg bg-[#09142B] p-4 font-mono text-xs leading-relaxed text-slate-200">
          {activeContent || 'Loading skill bundle...'}
        </pre>
      </div>

      {/* Live Trace Spans Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="font-display text-base font-semibold text-slate-900">
          Recent NPAO & ADK Execution Traces
        </h3>
        <p className="mt-0.5 text-xs text-slate-500">
          OpenTelemetry-compatible spans recorded from live studio runs, MCP calls, and ADK sessions.
        </p>

        {traces.length === 0 ? (
          <p className="mt-4 text-xs text-slate-500">
            No traces recorded yet. Run a PAL compilation, MCP probe, or ADK query to populate live spans.
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
                  <th className="py-2 text-right font-medium">Timestamp</th>
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
