import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  Copy,
  Download,
  FolderOpen,
  Loader2,
  Plus,
  Search,
  Send,
  SlidersHorizontal,
  Trash2,
  Wand2,
} from 'lucide-react';
import type {
  AspectRatio,
  BrandKit,
  RoutingMode,
  UniversalVideoTimeline,
  VideoProject,
} from '../types/monarch';
import { AgentInspectorView } from './AgentInspectorView';
import { VideoPreviewPlayer } from './VideoPreviewPlayer';

interface StudioWorkspaceProps {
  initialPrompt?: string;
  initialTab?: 'composer' | 'inspector';
}

const TEMPLATES = [
  { id: 'editorial-launch', name: 'Regal Editorial Launch', note: '16:9 · Product & Brand Releases' },
  { id: 'social-vertical-drop', name: 'Vertical Hardware Drop', note: '9:16 · Reels & Shorts' },
  { id: 'kinetic-explainer', name: 'Kinetic SaaS Explainer', note: '16:9 · Data & Architecture' },
  { id: 'brand-documentary', name: 'Atelier Brand Film', note: '16:9 · Measured Narrative' },
];

const DEFAULT_BRAND: BrandKit = {
  brandName: 'Monarch',
  tagline: 'Direct studio-grade video with natural language.',
  primaryColor: '#102D69',
  accentColor: '#D4AF37',
  surfaceColor: '#FAFBFD',
  fontPairing: 'Plus Jakarta Sans + DM Sans',
  logoStyle: 'monarch-crest',
};

type ArtifactTab = 'pal' | 'treatment' | 'storyboard' | 'script' | 'json' | 'code';

export const StudioWorkspace: React.FC<StudioWorkspaceProps> = ({
  initialPrompt = '',
  initialTab = 'composer',
}) => {
  const [studioMode, setStudioMode] = useState<'composer' | 'inspector'>(initialTab);
  const [projects, setProjects] = useState<VideoProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProject, setActiveProject] = useState<VideoProject | null>(null);

  // Composer Form State
  const [prompt, setPrompt] = useState(
    initialPrompt ||
      'Direct a 24-second 16:9 product launch reel for Monarch Video in Royal Blue and Satin Gold highlighting PAL intent extraction, storyboard approval, and editable Timeline JSON.'
  );
  const [templateId, setTemplateId] = useState('editorial-launch');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [durationSec, setDurationSec] = useState<number>(24);
  const [platform, setPlatform] = useState('Product Launch / Web');
  const [routingMode, setRoutingMode] = useState<RoutingMode>('managed-gateway');
  const [brandKit, setBrandKit] = useState<BrandKit>(DEFAULT_BRAND);

  // Pipeline Loading & Error States
  const [busyStage, setBusyStage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeArtifactTab, setActiveArtifactTab] = useState<ArtifactTab>('storyboard');
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);

  // Live JSON & Code Tabs
  const [editableJson, setEditableJson] = useState('');
  const [codeTarget, setCodeTarget] = useState<'hyperframes' | 'remotion'>('hyperframes');
  const [copiedCode, setCopiedCode] = useState(false);

  // Bi-Directional Conversational Diff Patch State
  const [patchInput, setPatchInput] = useState('');
  const [lastPatchNote, setLastPatchNote] = useState<{
    diffSummary: string;
    patchedSceneIds: string[];
    untouchedSceneIds: string[];
  } | null>(null);

  // ADK Artifacts list for active project
  const [adkArtifacts, setAdkArtifacts] = useState<string[]>([]);

  useEffect(() => {
    setStudioMode(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
      setActiveProject(null);
      setStudioMode('composer');
    }
  }, [initialPrompt]);

  const fetchProjects = async (autoSelectFirst = true) => {
    setLoadingProjects(true);
    try {
      const res = await fetch('/api/studio/projects');
      if (!res.ok) throw new Error('Unable to load projects.');
      const data = await res.json();
      const list = (data.projects || []) as VideoProject[];
      setProjects(list);
      if (autoSelectFirst && !initialPrompt && list.length > 0 && !activeProject) {
        selectProject(list[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    void fetchProjects(!initialPrompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshAdkArtifacts = async (projectId: string) => {
    try {
      const res = await fetch(`/api/adk/artifacts/${encodeURIComponent(projectId)}`);
      if (res.ok) {
        const data = await res.json();
        setAdkArtifacts(data.artifacts || []);
      }
    } catch {
      // Ignore optional artifact refresh errors
    }
  };

  const selectProject = (proj: VideoProject) => {
    setActiveProject(proj);
    setPrompt(proj.prompt);
    setAspectRatio(proj.aspectRatio);
    setDurationSec(proj.durationSec);
    setRoutingMode(proj.routingMode);
    setBrandKit(proj.brandKit);
    setLastPatchNote(null);
    setErrorMsg(null);
    if (proj.timeline) {
      setEditableJson(JSON.stringify(proj.timeline, null, 2));
      setSelectedSceneId(proj.timeline.scenes[0]?.id || null);
      setActiveArtifactTab('storyboard');
    } else if (proj.preProduction) {
      setActiveArtifactTab('treatment');
    } else {
      setActiveArtifactTab('pal');
    }
    void refreshAdkArtifacts(proj.id);
  };

  const persistProject = async (proj: VideoProject) => {
    setActiveProject(proj);
    setProjects((prev) => {
      const exists = prev.some((p) => p.id === proj.id);
      return exists ? prev.map((p) => (p.id === proj.id ? proj : p)) : [proj, ...prev];
    });
    await fetch('/api/studio/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proj),
    });
    void refreshAdkArtifacts(proj.id);
  };

  const handleDeleteProject = async (id: string) => {
    await fetch(`/api/studio/projects/${encodeURIComponent(id)}`, { method: 'DELETE' });
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (activeProject?.id === id) {
      setActiveProject(null);
    }
  };

  // STAGE 1: Run Sub-Skill B (`pal-video-compiler`)
  const handleRunPAL = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim() || busyStage) return;
    setBusyStage('Running 4-stage PAL Intent Extraction via Gemini & Google ADK...');
    setErrorMsg(null);
    setLastPatchNote(null);

    const projectId = `proj-${Date.now().toString(36)}`;
    try {
      const res = await fetch('/api/studio/pal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          prompt,
          aspectRatio,
          durationSec,
          platform,
          templateId,
          brandKit,
          routingMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'PAL compilation failed.');

      const nextProject: VideoProject = {
        id: projectId,
        title: data.pal.parseData.topic || 'Untitled Monarch Film',
        prompt,
        status: 'pal-ready',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        aspectRatio,
        durationSec,
        runtime: data.pal.hypothesis.selectedRuntime,
        routingMode,
        brandKit,
        pal: data.pal,
        editHistory: [],
      };
      await persistProject(nextProject);
      setActiveArtifactTab('pal');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyStage(null);
    }
  };

  // STAGE 2 (Approval Checkpoint 1 -> Artistic Pre-Production Suite)
  const handleApproveAndGeneratePreProduction = async () => {
    if (!activeProject?.pal || busyStage) return;
    setBusyStage('Drafting Project Brief, Treatment, Storyboard & Synced Script...');
    setErrorMsg(null);

    try {
      const res = await fetch('/api/studio/preproduction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: activeProject.id,
          pal: activeProject.pal,
          brandKit: activeProject.brandKit,
          templateId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Artistic pre-production failed.');

      const updated: VideoProject = {
        ...activeProject,
        title: data.preProduction.projectBrief.title || activeProject.title,
        status: 'preproduction-ready',
        preProduction: data.preProduction,
      };
      await persistProject(updated);
      setActiveArtifactTab('storyboard');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyStage(null);
    }
  };

  // STAGE 3 (Approval Checkpoint 2 -> Universal Timeline JSON + HyperFrames & Remotion Compilation)
  const handleApproveAndCompileTimeline = async () => {
    if (!activeProject?.pal || !activeProject?.preProduction || busyStage) return;
    setBusyStage('Validating Universal Video Timeline JSON & compiling HyperFrames + Remotion...');
    setErrorMsg(null);

    try {
      const res = await fetch('/api/studio/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: activeProject.id,
          pal: activeProject.pal,
          preProduction: activeProject.preProduction,
          brandKit: activeProject.brandKit,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Timeline compilation failed.');

      const updated: VideoProject = {
        ...activeProject,
        status: 'compiled',
        timeline: data.timeline,
        compiled: data.compiled,
      };
      setEditableJson(JSON.stringify(data.timeline, null, 2));
      setSelectedSceneId(data.timeline.scenes[0]?.id || null);
      await persistProject(updated);
      setActiveArtifactTab('storyboard');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyStage(null);
    }
  };

  // DIRECT JSON EDIT RECOMPILE
  const handleRecompileEditedJson = async () => {
    if (!activeProject || busyStage) return;
    setErrorMsg(null);
    let parsed: UniversalVideoTimeline;
    try {
      parsed = JSON.parse(editableJson) as UniversalVideoTimeline;
    } catch {
      setErrorMsg('Timeline JSON syntax error: please fix JSON formatting before recompiling.');
      return;
    }

    setBusyStage('Validating edited Timeline JSON and recompiling HyperFrames & Remotion...');
    try {
      const res = await fetch('/api/studio/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: activeProject.id,
          timeline: parsed,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Recompilation failed.');

      const updated: VideoProject = {
        ...activeProject,
        timeline: data.timeline,
        compiled: data.compiled,
        version: data.timeline.projectMeta.version,
      };
      setEditableJson(JSON.stringify(data.timeline, null, 2));
      await persistProject(updated);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyStage(null);
    }
  };

  // STAGE 4: Bi-Directional Conversational Diff Patch
  const handleConversationalPatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject?.timeline || !patchInput.trim() || busyStage) return;

    const instruction = patchInput.trim();
    setBusyStage('Running scoped PAL diff to patch only targeted scenes...');
    setErrorMsg(null);

    try {
      const res = await fetch('/api/studio/patch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: activeProject.id,
          timeline: activeProject.timeline,
          instruction,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Conversational patch failed.');

      const updated: VideoProject = {
        ...activeProject,
        timeline: data.timeline,
        compiled: data.compiled,
        version: data.timeline.projectMeta.version,
        durationSec: data.timeline.projectMeta.totalDurationSec,
        editHistory: [
          {
            version: data.timeline.projectMeta.version,
            timestamp: new Date().toISOString(),
            instruction,
            diffSummary: data.diffSummary,
            patchedSceneIds: data.patchedSceneIds,
          },
          ...(activeProject.editHistory || []),
        ],
      };

      setEditableJson(JSON.stringify(data.timeline, null, 2));
      if (data.patchedSceneIds?.[0]) {
        setSelectedSceneId(data.patchedSceneIds[0]);
      }
      setLastPatchNote({
        diffSummary: data.diffSummary,
        patchedSceneIds: data.patchedSceneIds,
        untouchedSceneIds: data.untouchedSceneIds,
      });
      setPatchInput('');
      await persistProject(updated);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyStage(null);
    }
  };

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) => p.title.toLowerCase().includes(q) || p.prompt.toLowerCase().includes(q)
    );
  }, [projects, searchQuery]);

  const activeCodeText =
    codeTarget === 'hyperframes'
      ? activeProject?.compiled?.hyperframesHtml || ''
      : activeProject?.compiled?.remotionTsx || '';

  const copyCode = async () => {
    await navigator.clipboard.writeText(activeCodeText);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1800);
  };

  const downloadFile = (filename: string, content: string, mime = 'text/plain;charset=utf-8') => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pipelineStep = !activeProject
    ? 0
    : activeProject.status === 'pal-ready'
      ? 1
      : activeProject.status === 'preproduction-ready'
        ? 2
        : 3;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-65px)] max-w-[1440px] flex-col lg:flex-row">
      {/* LEFT WORKSPACE SIDEBAR (264px) */}
      <aside className="flex w-full shrink-0 flex-col border-b border-slate-200 bg-white lg:w-[272px] lg:border-r lg:border-b-0">
        <div className="p-4">
          <button
            type="button"
            onClick={() => {
              setStudioMode('composer');
              setActiveProject(null);
              setErrorMsg(null);
              setLastPatchNote(null);
            }}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#102D69] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#091A3E] whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>New Video Project</span>
          </button>

          {/* Workspace Mode Selector */}
          <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setStudioMode('composer')}
              className={`rounded-md py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                studioMode === 'composer'
                  ? 'bg-white text-[#102D69] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Studio
            </button>
            <button
              type="button"
              onClick={() => setStudioMode('inspector')}
              className={`rounded-md py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                studioMode === 'inspector'
                  ? 'bg-white text-[#102D69] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ADK & ROSTR
            </button>
          </div>
        </div>

        {/* Previous Videos Library */}
        <div className="flex-1 overflow-y-auto border-t border-slate-100 px-4 py-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Previous Videos</span>
            <span className="font-mono text-[11px] text-slate-400 tabular-nums">
              {projects.length}
            </span>
          </div>

          <div className="relative mt-2.5">
            <Search className="pointer-events-none absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter projects..."
              className="h-8 w-full rounded-lg border border-slate-200 bg-[#FAFBFD] pr-3 pl-8 text-xs text-slate-800 outline-none focus:border-[#102D69]"
            />
          </div>

          <div className="mt-3 space-y-1.5">
            {loadingProjects ? (
              <div className="space-y-2 py-2">
                <div className="h-14 animate-pulse rounded-lg bg-slate-100" />
                <div className="h-14 animate-pulse rounded-lg bg-slate-100" />
              </div>
            ) : filteredProjects.length === 0 ? (
              <p className="py-4 text-xs text-slate-500">
                No saved projects match your filter. Create a new video above.
              </p>
            ) : (
              filteredProjects.map((proj) => {
                const isSelected = activeProject?.id === proj.id && studioMode === 'composer';
                return (
                  <div
                    key={proj.id}
                    className={`group flex items-start justify-between gap-2 rounded-lg border p-2.5 transition-colors ${
                      isSelected
                        ? 'border-[#102D69] bg-[#EEF3FA]'
                        : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setStudioMode('composer');
                        selectProject(proj);
                      }}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="truncate text-xs font-semibold text-slate-900">{proj.title}</p>
                      <p className="mt-1 font-mono text-[11px] text-slate-500 tabular-nums">
                        {proj.aspectRatio} · {proj.durationSec}s · v{proj.version}
                      </p>
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${proj.title}`}
                      onClick={() => void handleDeleteProject(proj.id)}
                      className="mt-0.5 rounded p-1 text-slate-400 opacity-0 transition-opacity hover:bg-white hover:text-red-600 group-hover:opacity-100 focus:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </aside>

      {/* MAIN STUDIO VIEWPORT */}
      <main className="min-w-0 flex-1 bg-[#FAFBFD] p-5 sm:p-8">
        {studioMode === 'inspector' ? (
          <AgentInspectorView />
        ) : (
          <div className="mx-auto max-w-[1080px] space-y-6">
            {/* Pipeline Progress Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs font-medium text-[#9A7B1C]">
                  {activeProject
                    ? `Project Workspace · v${activeProject.version} · ${activeProject.runtime}`
                    : 'New Production · Approval-Driven Pipeline'}
                </p>
                <h1 className="mt-0.5 font-display text-2xl font-bold tracking-tight text-slate-900">
                  {activeProject ? activeProject.title : 'Direct a New Programmatic Video'}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs">
                {[
                  { idx: 1, label: '01. PAL Intent' },
                  { idx: 2, label: '02. Pre-Production' },
                  { idx: 3, label: '03. Timeline & Code' },
                ].map((stage, i) => (
                  <React.Fragment key={stage.label}>
                    <span
                      className={`font-medium ${
                        pipelineStep >= stage.idx ? 'text-[#102D69]' : 'text-slate-400'
                      }`}
                    >
                      {stage.label}
                    </span>
                    {i < 2 && <span className="text-slate-300">/</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Busy / Error Banners */}
            {busyStage && (
              <div className="flex items-center gap-3 rounded-xl border border-[#102D69]/20 bg-[#EEF3FA] px-4 py-3 text-xs font-medium text-[#102D69]">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                <span>{busyStage}</span>
              </div>
            )}

            {errorMsg && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                {errorMsg}
              </div>
            )}

            {/* NEW PROJECT COMPOSER (when no project selected yet) */}
            {!activeProject ? (
              <form onSubmit={handleRunPAL} className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <label
                    htmlFor="studio-prompt-input"
                    className="block font-display text-sm font-semibold text-slate-900"
                  >
                    Describe your video vision
                  </label>
                  <p className="mt-1 text-xs text-slate-500">
                    Include your topic, target audience, pacing, and key call to action. Monarch runs
                    4-stage PAL extraction first and pauses for approval before drafting or rendering.
                  </p>
                  <textarea
                    id="studio-prompt-input"
                    rows={4}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="mt-3 w-full rounded-xl border border-slate-200 bg-[#FAFBFD] p-3.5 text-sm leading-relaxed text-slate-900 outline-none focus:border-[#102D69]"
                    placeholder="Example: Create a 30-second vertical launch ad for our architectural coffee roaster..."
                  />

                  {/* Template Picker */}
                  <div className="mt-6">
                    <p className="text-xs font-semibold text-slate-700">Visual Template</p>
                    <div className="mt-2 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                      {TEMPLATES.map((tpl) => {
                        const active = templateId === tpl.id;
                        return (
                          <button
                            key={tpl.id}
                            type="button"
                            onClick={() => {
                              setTemplateId(tpl.id);
                              if (tpl.id === 'social-vertical-drop') setAspectRatio('9:16');
                              else setAspectRatio('16:9');
                            }}
                            className={`rounded-xl border p-3 text-left transition-colors ${
                              active
                                ? 'border-[#102D69] bg-[#EEF3FA]'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <p className="text-xs font-semibold text-slate-900">{tpl.name}</p>
                            <p className="mt-1 text-[11px] text-slate-500">{tpl.note}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Format, Duration & Brand Kit Controls */}
                  <div className="mt-6 grid gap-5 border-t border-slate-100 pt-6 md:grid-cols-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Aspect Ratio
                      </label>
                      <div className="mt-2 grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">
                        {(['16:9', '9:16', '1:1'] as AspectRatio[]).map((ar) => (
                          <button
                            key={ar}
                            type="button"
                            onClick={() => setAspectRatio(ar)}
                            className={`rounded-md py-1.5 font-mono text-xs transition-colors ${
                              aspectRatio === ar
                                ? 'bg-white font-semibold text-[#102D69] shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {ar}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Target Duration
                      </label>
                      <div className="mt-2 grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">
                        {[18, 24, 36].map((sec) => (
                          <button
                            key={sec}
                            type="button"
                            onClick={() => setDurationSec(sec)}
                            className={`rounded-md py-1.5 font-mono text-xs tabular-nums transition-colors ${
                              durationSec === sec
                                ? 'bg-white font-semibold text-[#102D69] shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {sec}s
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Routing Mode
                      </label>
                      <div className="mt-2 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
                        <button
                          type="button"
                          onClick={() => setRoutingMode('managed-gateway')}
                          className={`rounded-md py-1.5 text-xs transition-colors ${
                            routingMode === 'managed-gateway'
                              ? 'bg-white font-semibold text-[#102D69] shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          AI Gateway
                        </button>
                        <button
                          type="button"
                          onClick={() => setRoutingMode('byok-server')}
                          className={`rounded-md py-1.5 text-xs transition-colors ${
                            routingMode === 'byok-server'
                              ? 'bg-white font-semibold text-[#102D69] shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Server BYOK
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Brand Kit Row */}
                  <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600">Brand Name</label>
                      <input
                        type="text"
                        value={brandKit.brandName}
                        onChange={(e) => setBrandKit({ ...brandKit, brandName: e.target.value })}
                        className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-900 outline-none focus:border-[#102D69]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600">Platform</label>
                      <input
                        type="text"
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value)}
                        className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-900 outline-none focus:border-[#102D69]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600">Primary Color</label>
                      <div className="mt-1.5 flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-2.5">
                        <input
                          type="color"
                          value={brandKit.primaryColor}
                          onChange={(e) => setBrandKit({ ...brandKit, primaryColor: e.target.value })}
                          className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0"
                        />
                        <span className="font-mono text-xs text-slate-700">
                          {brandKit.primaryColor}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600">Accent Color</label>
                      <div className="mt-1.5 flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-2.5">
                        <input
                          type="color"
                          value={brandKit.accentColor}
                          onChange={(e) => setBrandKit({ ...brandKit, accentColor: e.target.value })}
                          className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0"
                        />
                        <span className="font-mono text-xs text-slate-700">
                          {brandKit.accentColor}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5">
                    <p className="text-xs text-slate-500">
                      Step 1 runs <code className="font-mono">pal-video-compiler</code> and presents
                      a transparent cost estimate before pre-production.
                    </p>
                    <button
                      type="submit"
                      disabled={Boolean(busyStage)}
                      className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#102D69] px-5 text-xs font-semibold text-white transition-colors hover:bg-[#091A3E] disabled:opacity-60 whitespace-nowrap shrink-0"
                    >
                      <Wand2 className="h-3.5 w-3.5" />
                      <span>Run PAL Intent Extraction</span>
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* ACTIVE PROJECT APPROVAL WORKSPACE + LIVE PLAYER + TABBED ARTIFACT EDITOR */
              <div className="space-y-6">
                {/* APPROVAL CHECKPOINT CALLOUTS */}
                {activeProject.status === 'pal-ready' && (
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#D4AF37]/50 bg-[#FBF6E6] px-5 py-4">
                    <div>
                      <p className="text-xs font-semibold text-[#9A7B1C]">
                        Approval Checkpoint 1 · PAL Intent & Cost Estimate Ready
                      </p>
                      <p className="mt-0.5 text-xs text-slate-700">
                        Runtime: <span className="font-mono font-semibold">{activeProject.pal?.hypothesis.selectedRuntime}</span> ·
                        Est. {activeProject.routingMode === 'byok-server'
                          ? `$${activeProject.pal?.hypothesis.costEstimate.byokEstimatedUsd} BYOK`
                          : `${activeProject.pal?.hypothesis.costEstimate.managedCredits} Gateway credits`}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={Boolean(busyStage)}
                      onClick={() => void handleApproveAndGeneratePreProduction()}
                      className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#102D69] px-4 text-xs font-semibold text-white hover:bg-[#091A3E] disabled:opacity-60 whitespace-nowrap shrink-0"
                    >
                      <span>Approve & Draft Artistic Suite</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {activeProject.status === 'preproduction-ready' && (
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#D4AF37]/50 bg-[#FBF6E6] px-5 py-4">
                    <div>
                      <p className="text-xs font-semibold text-[#9A7B1C]">
                        Approval Checkpoint 2 · Treatment, Storyboard & Script Ready
                      </p>
                      <p className="mt-0.5 text-xs text-slate-700">
                        Review the {activeProject.preProduction?.storyboard.length || 0} scene cards below, then approve
                        compilation into Universal Video Timeline JSON + HyperFrames/Remotion code.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={Boolean(busyStage)}
                      onClick={() => void handleApproveAndCompileTimeline()}
                      className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#102D69] px-4 text-xs font-semibold text-white hover:bg-[#091A3E] disabled:opacity-60 whitespace-nowrap shrink-0"
                    >
                      <span>Approve & Compile Timeline JSON</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {/* LIVE PREVIEW PLAYER + CONVERSATIONAL PATCH BAR (once compiled) */}
                {activeProject.timeline && (
                  <div className="grid gap-6 xl:grid-cols-12">
                    <div className="xl:col-span-7">
                      <VideoPreviewPlayer
                        timeline={activeProject.timeline}
                        activeSceneId={selectedSceneId}
                        onSelectScene={(id) => setSelectedSceneId(id)}
                      />
                    </div>

                    {/* Bi-Directional Conversational Diff Panel */}
                    <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 xl:col-span-5">
                      <div>
                        <p className="text-xs font-medium text-[#9A7B1C]">
                          Sub-Skill D · Non-Destructive Diff Loop
                        </p>
                        <h2 className="mt-1 font-display text-base font-semibold text-slate-900">
                          Conversational Timeline Editing
                        </h2>
                        <p className="mt-1 text-xs leading-relaxed text-slate-600">
                          Describe a change to any scene. Monarch runs a scoped PAL diff, patches
                          only targeted JSON nodes, and preserves untouched scenes.
                        </p>

                        {/* Quick-Try Edit Chips (Interactive Buttons) */}
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {[
                            'Make scene 2 punchier and swap its background to royal blue',
                            'Slow the final logo outro by 2 seconds',
                            'Rewrite scene 1 headline to be shorter and bolder',
                          ].map((suggestion) => (
                            <button
                              key={suggestion}
                              type="button"
                              onClick={() => setPatchInput(suggestion)}
                              className="rounded-md border border-slate-200 bg-[#FAFBFD] px-2.5 py-1 text-left text-[11px] text-slate-600 transition-colors hover:border-[#102D69] hover:text-[#102D69]"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>

                        {lastPatchNote && (
                          <div className="mt-4 rounded-lg border border-slate-200 bg-[#EEF3FA]/70 p-3 text-xs">
                            <p className="font-semibold text-[#102D69]">Scoped Patch Applied</p>
                            <p className="mt-1 text-slate-700">{lastPatchNote.diffSummary}</p>
                            <p className="mt-1.5 font-mono text-[11px] text-slate-600">
                              Patched: {lastPatchNote.patchedSceneIds.join(', ') || 'none'} · Preserved:{' '}
                              {lastPatchNote.untouchedSceneIds.join(', ') || 'none'}
                            </p>
                          </div>
                        )}

                        {adkArtifacts.length > 0 && (
                          <div className="mt-4 border-t border-slate-100 pt-3">
                            <p className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                              <FolderOpen className="h-3.5 w-3.5 text-[#102D69]" />
                              <span>Google ADK ArtifactService ({adkArtifacts.length})</span>
                            </p>
                            <p className="mt-1 font-mono text-[11px] text-slate-600">
                              {adkArtifacts.join(' · ')}
                            </p>
                          </div>
                        )}
                      </div>

                      <form onSubmit={handleConversationalPatch} className="mt-4 space-y-2.5">
                        <textarea
                          rows={2}
                          value={patchInput}
                          onChange={(e) => setPatchInput(e.target.value)}
                          placeholder='e.g., "Make scene 2 punchier, swap background to #102D69, and slow the outro"'
                          className="w-full rounded-lg border border-slate-200 bg-[#FAFBFD] p-2.5 text-xs text-slate-900 outline-none focus:border-[#102D69]"
                        />
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                            v{activeProject.version} · {activeProject.timeline.scenes.length} scenes
                          </span>
                          <button
                            type="submit"
                            disabled={!patchInput.trim() || Boolean(busyStage)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#102D69] px-3.5 text-xs font-semibold text-white transition-colors hover:bg-[#091A3E] disabled:opacity-50 whitespace-nowrap shrink-0"
                          >
                            <Send className="h-3.5 w-3.5" />
                            <span>Patch Timeline</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* TABBED EDITABLE ARTIFACTS */}
                <div className="rounded-2xl border border-slate-200 bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                    <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
                      {(
                        [
                          { id: 'pal', label: 'PAL Brief' },
                          { id: 'treatment', label: 'Treatment' },
                          { id: 'storyboard', label: 'Storyboard' },
                          { id: 'script', label: 'Script & Cues' },
                          { id: 'json', label: 'Timeline JSON' },
                          { id: 'code', label: 'Compiled Code' },
                        ] as Array<{ id: ArtifactTab; label: string }>
                      ).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveArtifactTab(tab.id)}
                          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                            activeArtifactTab === tab.id
                              ? 'bg-white text-[#102D69] shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {activeProject.timeline && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            downloadFile(
                              `${activeProject.id}-timeline.json`,
                              JSON.stringify(activeProject.timeline, null, 2),
                              'application/json'
                            )
                          }
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Export JSON</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    {/* TAB 1: PAL BRIEF */}
                    {activeArtifactTab === 'pal' && activeProject.pal && (
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs font-semibold text-[#102D69]">01. Parse Data</p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">
                              {activeProject.pal.parseData.topic}
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-slate-600">
                              {activeProject.pal.parseData.brandSummary}
                            </p>
                            <p className="mt-2 font-mono text-[11px] text-slate-500 tabular-nums">
                              {activeProject.pal.parseData.aspectRatio} ·{' '}
                              {activeProject.pal.parseData.durationSec}s ·{' '}
                              {activeProject.pal.parseData.platform}
                            </p>
                          </div>

                          <div className="border-t border-slate-100 pt-4">
                            <p className="text-xs font-semibold text-[#102D69]">
                              02. Semantic Analysis
                            </p>
                            <dl className="mt-2 space-y-1.5 text-xs">
                              <div>
                                <dt className="inline font-medium text-slate-500">Classification: </dt>
                                <dd className="inline text-slate-900">
                                  {activeProject.pal.semanticAnalysis.projectClassification}
                                </dd>
                              </div>
                              <div>
                                <dt className="inline font-medium text-slate-500">Audience: </dt>
                                <dd className="inline text-slate-900">
                                  {activeProject.pal.semanticAnalysis.audiencePersona}
                                </dd>
                              </div>
                              <div>
                                <dt className="inline font-medium text-slate-500">Emotional Arc: </dt>
                                <dd className="inline text-slate-900">
                                  {activeProject.pal.semanticAnalysis.emotionalArc}
                                </dd>
                              </div>
                              <div>
                                <dt className="inline font-medium text-slate-500">Pacing: </dt>
                                <dd className="inline text-slate-900">
                                  {activeProject.pal.semanticAnalysis.pacing}
                                </dd>
                              </div>
                            </dl>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <p className="text-xs font-semibold text-[#102D69]">
                              03. Runtime Hypothesis & Cost Estimate
                            </p>
                            <p className="mt-1 font-mono text-xs font-semibold text-slate-900">
                              {activeProject.pal.hypothesis.selectedRuntime}
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-slate-600">
                              {activeProject.pal.hypothesis.runtimeRationale}
                            </p>
                            {activeProject.pal.hypothesis.licenseAdvisory && (
                              <p className="mt-2 text-xs text-[#9A7B1C]">
                                {activeProject.pal.hypothesis.licenseAdvisory}
                              </p>
                            )}

                            <div className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-[#FAFBFD] px-3 py-1 text-xs">
                              {activeProject.pal.hypothesis.costEstimate.costBreakdown.map((row) => (
                                <div key={row.stage} className="flex items-center justify-between py-2">
                                  <div>
                                    <p className="font-medium text-slate-800">{row.stage}</p>
                                    <p className="text-[11px] text-slate-500">{row.detail}</p>
                                  </div>
                                  <span className="font-mono font-medium text-slate-900 tabular-nums">
                                    ${row.usdEstimate.toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="border-t border-slate-100 pt-4">
                            <p className="text-xs font-semibold text-[#102D69]">
                              04. Master Creative Prompt
                            </p>
                            <p className="mt-1.5 text-xs leading-relaxed text-slate-700">
                              {activeProject.pal.masterCreativePrompt}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 2: TREATMENT */}
                    {activeArtifactTab === 'treatment' && (
                      activeProject.preProduction ? (
                        <div className="grid gap-6 md:grid-cols-2">
                          <div className="space-y-4">
                            <div>
                              <p className="text-xs font-medium text-slate-500">Project Brief</p>
                              <h3 className="mt-1 font-display text-lg font-semibold text-slate-900">
                                {activeProject.preProduction.projectBrief.title}
                              </h3>
                              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                                {activeProject.preProduction.projectBrief.objective}
                              </p>
                              <p className="mt-2 text-xs text-slate-500">
                                Deliverable: {activeProject.preProduction.projectBrief.deliverableType} · CTA:{' '}
                                <span className="font-medium text-slate-800">
                                  {activeProject.preProduction.projectBrief.primaryCta}
                                </span>
                              </p>
                            </div>

                            <div className="border-t border-slate-100 pt-4">
                              <p className="text-xs font-medium text-slate-500">Director’s Logline & Hook</p>
                              <p className="mt-1 text-sm font-medium text-slate-900">
                                {activeProject.preProduction.videoTreatment.logline}
                              </p>
                              <p className="mt-2 text-xs text-slate-600">
                                Opening Hook: “{activeProject.preProduction.videoTreatment.narrativeHook}”
                              </p>
                            </div>
                          </div>

                          <div className="space-y-3 text-xs leading-relaxed text-slate-600">
                            <div>
                              <p className="font-semibold text-slate-900">Visual Mood</p>
                              <p className="mt-0.5">{activeProject.preProduction.videoTreatment.visualMood}</p>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">Lighting & Motion Language</p>
                              <p className="mt-0.5">{activeProject.preProduction.videoTreatment.lightingAndMotion}</p>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">Soundscape & Music</p>
                              <p className="mt-0.5">{activeProject.preProduction.videoTreatment.soundscapeAndMusic}</p>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">Voiceover Direction</p>
                              <p className="mt-0.5">{activeProject.preProduction.videoTreatment.voiceoverDirection}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">
                          Approve the PAL Intent checkpoint above to generate the full Artistic Treatment.
                        </p>
                      )
                    )}

                    {/* TAB 3: STORYBOARD */}
                    {activeArtifactTab === 'storyboard' && (
                      activeProject.preProduction ? (
                        <div className="grid gap-4 md:grid-cols-2">
                          {activeProject.preProduction.storyboard.map((card) => {
                            const isFocused = selectedSceneId === card.sceneId;
                            return (
                              <button
                                key={card.sceneId}
                                type="button"
                                onClick={() => setSelectedSceneId(card.sceneId)}
                                className={`rounded-xl border p-4 text-left transition-colors ${
                                  isFocused
                                    ? 'border-[#102D69] bg-[#EEF3FA]/60'
                                    : 'border-slate-200 bg-[#FAFBFD] hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2 text-xs">
                                  <span className="font-mono font-semibold text-[#102D69]">
                                    Scene {card.sceneNumber} · {card.title}
                                  </span>
                                  <span className="font-mono text-slate-500 tabular-nums">
                                    {card.durationSec}s · {card.assetSource}
                                  </span>
                                </div>
                                <p className="mt-2 font-display text-sm font-semibold text-slate-900">
                                  “{card.onScreenText}”
                                </p>
                                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                                  {card.visualFraming}
                                </p>
                                <p className="mt-2 text-[11px] text-slate-500">
                                  Motion: {card.motionChoreography}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">
                          Approve the PAL Intent checkpoint above to generate Shot-by-Shot Storyboard cards.
                        </p>
                      )
                    )}

                    {/* TAB 4: SCRIPT & CUE SHEET */}
                    {activeArtifactTab === 'script' && (
                      activeProject.preProduction ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-500">
                                <th className="py-2 pr-4 font-medium">Timecode</th>
                                <th className="py-2 pr-4 font-medium">Voiceover</th>
                                <th className="py-2 pr-4 font-medium">Kinetic Headline</th>
                                <th className="py-2 font-medium">Music & SFX</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {activeProject.preProduction.scriptAndCueSheet.map((row) => (
                                <tr
                                  key={row.sceneId}
                                  onClick={() => setSelectedSceneId(row.sceneId)}
                                  className="cursor-pointer hover:bg-slate-50"
                                >
                                  <td className="py-3 pr-4 font-mono whitespace-nowrap text-[#102D69] tabular-nums">
                                    {row.timecode}
                                  </td>
                                  <td className="py-3 pr-4 leading-relaxed text-slate-800">
                                    {row.voiceover}
                                  </td>
                                  <td className="py-3 pr-4 font-medium text-slate-900">
                                    {row.kineticHeadline}
                                  </td>
                                  <td className="py-3 text-slate-500">
                                    {row.musicCue} · {row.sfxCue}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">
                          Approve the PAL Intent checkpoint above to generate the time-coded Script & Cue Sheet.
                        </p>
                      )
                    )}

                    {/* TAB 5: LIVE EDITABLE TIMELINE JSON */}
                    {activeArtifactTab === 'json' && (
                      activeProject.timeline ? (
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs text-slate-600">
                              Edit any scene directly in <code className="font-mono">UniversalVideoTimeline</code> JSON
                              and recompile to update the preview player and generated code.
                            </p>
                            <button
                              type="button"
                              disabled={Boolean(busyStage)}
                              onClick={() => void handleRecompileEditedJson()}
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#102D69] px-3.5 text-xs font-semibold text-white hover:bg-[#091A3E] disabled:opacity-50 whitespace-nowrap shrink-0"
                            >
                              <SlidersHorizontal className="h-3.5 w-3.5" />
                              <span>Validate & Sync Preview</span>
                            </button>
                          </div>
                          <textarea
                            rows={18}
                            value={editableJson}
                            onChange={(e) => setEditableJson(e.target.value)}
                            spellCheck={false}
                            className="w-full rounded-xl border border-slate-200 bg-[#09142B] p-4 font-mono text-xs leading-relaxed text-slate-100 outline-none focus:border-[#D4AF37]"
                          />
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">
                          Approve Pre-Production above to compile the Universal Video Timeline JSON.
                        </p>
                      )
                    )}

                    {/* TAB 6: DETERMINISTIC COMPILED CODE (HYPERFRAMES & REMOTION) */}
                    {activeArtifactTab === 'code' && (
                      activeProject.compiled ? (
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                              <button
                                type="button"
                                onClick={() => setCodeTarget('hyperframes')}
                                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                                  codeTarget === 'hyperframes'
                                    ? 'bg-white text-[#102D69] shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                HyperFrames HTML/GSAP
                              </button>
                              <button
                                type="button"
                                onClick={() => setCodeTarget('remotion')}
                                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                                  codeTarget === 'remotion'
                                    ? 'bg-white text-[#102D69] shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                Remotion TSX
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => void copyCode()}
                                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
                              >
                                {copiedCode ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                                <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  downloadFile(
                                    codeTarget === 'hyperframes'
                                      ? `${activeProject.id}-hyperframes.html`
                                      : `${activeProject.id}-MonarchComposition.tsx`,
                                    activeCodeText
                                  )
                                }
                                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#102D69] px-3 text-xs font-medium text-white hover:bg-[#091A3E] whitespace-nowrap shrink-0"
                              >
                                <Download className="h-3.5 w-3.5" />
                                <span>
                                  Download {codeTarget === 'hyperframes' ? '.html' : '.tsx'}
                                </span>
                              </button>
                            </div>
                          </div>

                          <pre className="max-h-[420px] overflow-auto rounded-xl bg-[#09142B] p-4 font-mono text-xs leading-relaxed text-slate-200">
                            {activeCodeText}
                          </pre>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">
                          Compile Timeline JSON first to export runnable HyperFrames HTML/GSAP and Remotion TSX code.
                        </p>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
