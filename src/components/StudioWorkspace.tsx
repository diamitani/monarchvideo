import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Cloud,
  Copy,
  Download,
  FileAudio,
  FileImage,
  FileText,
  Film,
  FolderOpen,
  Globe,
  Link2,
  Loader2,
  LogIn,
  LogOut,
  Menu,
  Mic,
  Music,
  Palette,
  Play,
  Plus,
  Plug,
  Search,
  Send,
  Sliders,
  Sparkles,
  Trash2,
  Upload,
  Volume2,
  Wand2,
  X,
} from 'lucide-react';
import {
  deleteCloudMediaAsset,
  deleteUserCloudProject,
  loadUserCloudProjects,
  saveCloudMediaAsset,
  saveUserCloudProject,
} from '../lib/firebase';
import { ProceduralStudioAudio } from '../lib/proceduralAudio';
import type {
  AnimationPresetId,
  ArtisticPreProduction,
  AspectRatio,
  BootstrapReport,
  BrandKit,
  CompiledTargets,
  MediaAsset,
  MusicPresetId,
  OpenMontageVideoPresetId,
  PALOutput,
  UniversalVideoTimeline,
  VideoProject,
  VoiceoverClip,
  VoiceoverVoiceName,
  WorkspaceIntegration,
} from '../types/monarch';
import { AgentInspectorView } from './AgentInspectorView';
import { MonarchLogo } from './MonarchLogo';
import { VideoPreviewPlayer } from './VideoPreviewPlayer';

type DashboardSection = 'projects' | 'create' | 'files' | 'models' | 'integrations';
type ProjectFilter = 'all' | 'drafts' | 'published';

const TEMPLATES = [
  { id: 'editorial-launch', name: 'Editorial Launch', note: 'Clean typography & gold rules' },
  { id: 'social-vertical-drop', name: 'Social Product Drop', note: 'Fast hook for 9:16 feeds' },
  { id: 'brand-film', name: 'Brand Story Film', note: 'Warm narrative pacing' },
  { id: 'feature-explainer', name: 'Product Explainer', note: 'Clear step-by-step clarity' },
];

const VOICE_OPTIONS: Array<{
  id: VoiceoverVoiceName;
  label: string;
  tone: string;
  sampleLine: string;
}> = [
  {
    id: 'Kore',
    label: 'Kore — Editorial Warmth',
    tone: 'Warm, composed, unhurried documentary narrator',
    sampleLine: 'Welcome to Monarch Video. Describe your vision once, and refine every scene with calm precision.',
  },
  {
    id: 'Fenrir',
    label: 'Fenrir — Executive Authority',
    tone: 'Deep, understated, confident hardware launch voice',
    sampleLine: 'Engineered from solid materials. Built for founders and studios who refuse to compromise on craft.',
  },
  {
    id: 'Puck',
    label: 'Puck — Crisp & Energetic',
    tone: 'Bright, agile, modern product launch host',
    sampleLine: 'Meet the fastest way to turn a product announcement into a studio-ready launch film in minutes.',
  },
  {
    id: 'Charon',
    label: 'Charon — Cinema Trailer',
    tone: 'Measured, atmospheric, resonant film voice',
    sampleLine: 'Every frame has weight. Every silence has intention. Direct your story from start to finish.',
  },
  {
    id: 'Zephyr',
    label: 'Zephyr — Friendly Guide',
    tone: 'Approachable, articulate product walkthrough narrator',
    sampleLine: 'Here is how your team goes from a rough idea to a published, branded video without leaving one workspace.',
  },
];

const MUSIC_OPTIONS: Array<{ id: MusicPresetId; label: string; note: string; bpm: number }> = [
  { id: 'cello-ostinato', label: 'Chamber Cello', note: 'Warm editorial strings', bpm: 96 },
  { id: 'felt-piano', label: 'Felt Piano', note: 'Intimate studio keys', bpm: 84 },
  { id: 'minimal-pulse', label: 'Minimal Pulse', note: 'Modern rhythmic drive', bpm: 120 },
  { id: 'ambient-glass', label: 'Ambient Glass', note: 'Airy minimalist texture', bpm: 76 },
];

const MOTION_OPTIONS: Array<{ id: AnimationPresetId; label: string; note: string }> = [
  { id: 'kinetic-editorial', label: 'Editorial Rise', note: 'Measured vertical reveals' },
  { id: 'satin-gold-wipe', label: 'Gold Sweep', note: 'Horizontal curtain wipes' },
  { id: 'architectural-split', label: 'Architectural Split', note: 'Crisp two-axis framing' },
  { id: 'cinematic-zoom', label: 'Cinematic Push', note: 'Subtle slow camera dolly' },
];

const VISUAL_LOOK_OPTIONS: Array<{
  id: OpenMontageVideoPresetId;
  label: string;
  swatch: [string, string];
}> = [
  { id: 'royal-architectural', label: 'Royal Navy & Gold', swatch: ['#102D69', '#D4AF37'] },
  { id: 'cinema-lens-noir', label: 'Midnight Cinema', swatch: ['#09142B', '#D4AF37'] },
  { id: 'alabaster-editorial', label: 'Alabaster Light', swatch: ['#FAFBFD', '#102D69'] },
  { id: 'prism-optical', label: 'Deep Sapphire', swatch: ['#163B8C', '#E6C666'] },
];

interface StudioWorkspaceProps {
  user: User | null;
  initialPrompt?: string;
  onRequestAuth: (mode: 'signin' | 'signup') => void;
  onSignOut: () => void;
  onBackToMarketing: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const StudioWorkspace: React.FC<StudioWorkspaceProps> = ({
  user,
  initialPrompt = '',
  onRequestAuth,
  onSignOut,
  onBackToMarketing,
}) => {
  const [section, setSection] = useState<DashboardSection>(initialPrompt ? 'create' : 'projects');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);

  // Library & App Data
  const [projects, setProjects] = useState<VideoProject[]>([]);
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>('all');
  const [projectSearch, setProjectSearch] = useState('');
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [assetCategoryFilter, setAssetCategoryFilter] = useState<'all' | MediaAsset['category']>('all');
  const [integrations, setIntegrations] = useState<WorkspaceIntegration[]>([]);
  const [bootstrap, setBootstrap] = useState<BootstrapReport | null>(null);
  const [cloudSynced, setCloudSynced] = useState(false);

  // Active Video Creation / Editor State
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [projectStatus, setProjectStatus] = useState<VideoProject['status']>('draft');
  const [prompt, setPrompt] = useState(
    initialPrompt ||
      'Create a 24-second product launch video introducing our architectural acoustic desk lamp, highlighting warm brass craft and calm workspace focus.'
  );
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [durationSec, setDurationSec] = useState<number>(24);
  const [templateId, setTemplateId] = useState<string>('editorial-launch');
  const [brandKit, setBrandKit] = useState<BrandKit>({
    brandName: 'Monarch',
    tagline: 'Studio-grade video from plain English.',
    primaryColor: '#102D69',
    accentColor: '#D4AF37',
    surfaceColor: '#FAFBFD',
    fontPairing: 'Plus Jakarta Sans + DM Sans',
    logoStyle: 'monarch-crest',
  });
  const [attachedAssetIds, setAttachedAssetIds] = useState<string[]>([]);

  // Workspace / Active Video Media Preferences
  const [selectedVoice, setSelectedVoice] = useState<VoiceoverVoiceName>('Kore');
  const [selectedMusic, setSelectedMusic] = useState<MusicPresetId>('cello-ostinato');
  const [selectedMotion, setSelectedMotion] = useState<AnimationPresetId>('kinetic-editorial');
  const [selectedLook, setSelectedLook] = useState<OpenMontageVideoPresetId>('royal-architectural');
  const [voiceoverClips, setVoiceoverClips] = useState<VoiceoverClip[]>([]);

  // Pipeline Artifacts
  const [pal, setPal] = useState<PALOutput | null>(null);
  const [preProduction, setPreProduction] = useState<ArtisticPreProduction | null>(null);
  const [timeline, setTimeline] = useState<UniversalVideoTimeline | null>(null);
  const [compiled, setCompiled] = useState<CompiledTargets | null>(null);
  const [editHistory, setEditHistory] = useState<VideoProject['editHistory']>([]);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<'storyboard' | 'script' | 'treatment' | 'export'>('storyboard');
  const [codeTab, setCodeTab] = useState<'html' | 'tsx' | 'json'>('html');

  // Conversational Edit & Async Status
  const [patchInstruction, setPatchInstruction] = useState('');
  const [lastPatchNote, setLastPatchNote] = useState<string | null>(null);
  const [busyStage, setBusyStage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Voice & Music Audition state
  const [auditioningVoice, setAuditioningVoice] = useState<VoiceoverVoiceName | null>(null);
  const [playingMusicId, setPlayingMusicId] = useState<MusicPresetId | null>(null);
  const auditionAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewMusicRef = useRef<ProceduralStudioAudio | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg((prev) => (prev === msg ? null : prev)), 3200);
  };

  // Load backend workspace data + merge user's Firestore cloud projects if signed in
  const loadWorkspaceData = async () => {
    try {
      const [pRes, aRes, iRes, bRes] = await Promise.all([
        fetch('/api/studio/projects'),
        fetch('/api/assets'),
        fetch('/api/integrations'),
        fetch('/api/agent/bootstrap'),
      ]);

      let localProjects: VideoProject[] = [];
      if (pRes.ok) {
        const data = await pRes.json();
        localProjects = data.projects || [];
      }
      if (aRes.ok) {
        const data = await aRes.json();
        setAssets(data.assets || []);
      }
      if (iRes.ok) {
        const data = await iRes.json();
        setIntegrations(data.integrations || []);
      }
      if (bRes.ok) {
        setBootstrap(await bRes.json());
      }

      if (user) {
        try {
          const cloudProjects = await loadUserCloudProjects(user.uid);
          const mergedMap = new Map<string, VideoProject>();
          for (const lp of localProjects) mergedMap.set(lp.id, lp);
          for (const cp of cloudProjects) {
            const existing = mergedMap.get(cp.id);
            mergedMap.set(cp.id, {
              ...cp,
              compiled: existing?.compiled || cp.compiled,
            });
          }
          setProjects(
            Array.from(mergedMap.values()).sort(
              (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            )
          );
          setCloudSynced(true);
        } catch {
          setProjects(localProjects);
        }
      } else {
        setProjects(localProjects);
        setCloudSynced(false);
      }
    } catch (err) {
      console.error('Failed to load workspace data:', err);
    }
  };

  useEffect(() => {
    void loadWorkspaceData();
    return () => {
      auditionAudioRef.current?.pause();
      previewMusicRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      setPrompt(initialPrompt);
      setSection('create');
    }
  }, [initialPrompt]);

  const persistProject = async (next: VideoProject) => {
    setProjects((prev) => {
      const idx = prev.findIndex((p) => p.id === next.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = next;
        return copy;
      }
      return [next, ...prev];
    });

    try {
      await fetch('/api/studio/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      if (user) {
        await saveUserCloudProject(user.uid, next);
        setCloudSynced(true);
      }
    } catch (err) {
      console.error('Project save error:', err);
    }
  };

  const startFreshVideo = () => {
    setActiveProjectId(null);
    setProjectStatus('draft');
    setPal(null);
    setPreProduction(null);
    setTimeline(null);
    setCompiled(null);
    setVoiceoverClips([]);
    setEditHistory([]);
    setLastPatchNote(null);
    setErrorMsg(null);
    setSection('create');
    setMobileMenuOpen(false);
  };

  const openProject = (proj: VideoProject) => {
    setActiveProjectId(proj.id);
    setProjectStatus(proj.status);
    setPrompt(proj.prompt);
    setAspectRatio(proj.aspectRatio);
    setDurationSec(proj.durationSec);
    setBrandKit(proj.brandKit);
    setAttachedAssetIds(proj.attachedAssetIds || []);
    setPal(proj.pal || null);
    setPreProduction(proj.preProduction || null);
    setTimeline(proj.timeline || null);
    setCompiled(proj.compiled || null);
    setEditHistory(proj.editHistory || []);
    setSelectedVoice(proj.mediaSelections?.voiceover.voiceName || 'Kore');
    setSelectedMusic(proj.mediaSelections?.audio.musicPreset || 'cello-ostinato');
    setSelectedMotion(proj.mediaSelections?.animationPreset || 'kinetic-editorial');
    setSelectedLook(proj.mediaSelections?.videoPreset || 'royal-architectural');
    setVoiceoverClips(proj.mediaSelections?.voiceover.clips || []);
    setLastPatchNote(null);
    setErrorMsg(null);
    setSection('create');
    setMobileMenuOpen(false);
  };

  const handleTogglePublish = async (proj: VideoProject) => {
    const willPublish = proj.status !== 'published';
    try {
      const res = await fetch(`/api/studio/projects/${proj.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: willPublish }),
      });
      const updated: VideoProject = res.ok
        ? (await res.json()).project
        : { ...proj, status: willPublish ? 'published' : 'compiled', updatedAt: new Date().toISOString() };

      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      if (activeProjectId === updated.id) {
        setProjectStatus(updated.status);
      }
      if (user) {
        void saveUserCloudProject(user.uid, updated);
      }
      showToast(willPublish ? `"${updated.title}" moved to Published.` : `"${updated.title}" moved back to Drafts.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDeleteProject = async (projId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projId));
    if (activeProjectId === projId) {
      startFreshVideo();
    }
    try {
      await fetch(`/api/studio/projects/${projId}`, { method: 'DELETE' });
      if (user) {
        await deleteUserCloudProject(projId);
      }
      showToast('Project removed from library.');
    } catch (err) {
      console.error('Delete project error:', err);
    }
  };

  // --- Creator Pipeline Step 1: Plan & Creative Direction ---
  const handleCreatePlan = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim() || busyStage) return;
    setBusyStage('Drafting your video plan...');
    setErrorMsg(null);
    setPreProduction(null);
    setTimeline(null);
    setCompiled(null);
    setVoiceoverClips([]);
    setLastPatchNote(null);

    try {
      const projectId = activeProjectId || `proj-${Date.now().toString(36)}`;
      setActiveProjectId(projectId);

      const attachedAssets = assets.filter((a) => attachedAssetIds.includes(a.id));
      const res = await fetch('/api/studio/pal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          prompt,
          aspectRatio,
          durationSec,
          platform:
            aspectRatio === '9:16'
              ? 'Instagram Reels / TikTok / Shorts'
              : aspectRatio === '1:1'
                ? 'LinkedIn / Social Feed'
                : 'Website Hero / YouTube',
          templateId,
          brandKit,
          routingMode: 'managed-gateway',
          referenceUrls: attachedAssets.map((a) => a.url),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not draft plan.');
      setPal(data.pal);
      setProjectStatus('pal-ready');

      await persistProject({
        id: projectId,
        title: data.pal.parseData.topic || 'Untitled Video',
        prompt,
        status: 'pal-ready',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        aspectRatio,
        durationSec,
        runtime: data.pal.hypothesis.selectedRuntime,
        routingMode: 'managed-gateway',
        brandKit,
        attachedAssetIds,
        mediaSelections: {
          voiceover: {
            voiceName: selectedVoice,
            style: VOICE_OPTIONS.find((v) => v.id === selectedVoice)?.tone || 'Warm narrator',
            model: 'gemini-3.8-flash-lite-tts',
            clips: [],
          },
          audio: {
            musicPreset: selectedMusic,
            bpm: MUSIC_OPTIONS.find((m) => m.id === selectedMusic)?.bpm || 96,
            musicVolume: 0.24,
            duckingDb: -14,
            sfxEnabled: true,
          },
          animationPreset: selectedMotion,
          videoPreset: selectedLook,
        },
        pal: data.pal,
        editHistory: [],
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyStage(null);
    }
  };

  // --- Creator Pipeline Step 2: Storyboard, Treatment & Script ---
  const handleGenerateStoryboard = async () => {
    if (!pal || busyStage) return;
    setBusyStage('Writing treatment, storyboard, and script...');
    setErrorMsg(null);
    try {
      const res = await fetch('/api/studio/preproduction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: activeProjectId,
          pal,
          brandKit,
          templateId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not generate storyboard.');
      setPreProduction(data.preProduction);
      setProjectStatus('preproduction-ready');
      setDetailTab('storyboard');

      if (activeProjectId) {
        const existing = projects.find((p) => p.id === activeProjectId);
        await persistProject({
          ...(existing || {
            id: activeProjectId,
            title: data.preProduction.projectBrief.title,
            prompt,
            createdAt: new Date().toISOString(),
            version: 1,
            aspectRatio,
            durationSec,
            runtime: pal.hypothesis.selectedRuntime,
            routingMode: 'managed-gateway',
            brandKit,
            editHistory: [],
          }),
          title: data.preProduction.projectBrief.title,
          status: 'preproduction-ready',
          updatedAt: new Date().toISOString(),
          pal,
          preProduction: data.preProduction,
        });
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyStage(null);
    }
  };

  // --- Creator Pipeline Step 3: Build Live Interactive Video Cut ---
  const handleBuildVideoCut = async () => {
    if (!pal || !preProduction || busyStage) return;
    setBusyStage('Building your live video cut...');
    setErrorMsg(null);
    try {
      const res = await fetch('/api/studio/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: activeProjectId,
          pal,
          preProduction,
          brandKit,
          animationPreset: selectedMotion,
          videoPreset: selectedLook,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not build video cut.');
      setTimeline(data.timeline);
      setCompiled(data.compiled);
      setProjectStatus('compiled');
      setDetailTab('storyboard');

      if (activeProjectId) {
        const existing = projects.find((p) => p.id === activeProjectId);
        await persistProject({
          ...(existing || {
            id: activeProjectId,
            title: preProduction.projectBrief.title,
            prompt,
            createdAt: new Date().toISOString(),
            version: 1,
            aspectRatio,
            durationSec,
            runtime: pal.hypothesis.selectedRuntime,
            routingMode: 'managed-gateway',
            brandKit,
            editHistory: [],
          }),
          title: preProduction.projectBrief.title,
          status: 'compiled',
          updatedAt: new Date().toISOString(),
          pal,
          preProduction,
          timeline: data.timeline,
          compiled: data.compiled,
        });
      }
      showToast('Your live video cut is ready to play and refine.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyStage(null);
    }
  };

  // --- Synthesize Real Studio Voiceover for All Scenes ---
  const handleGenerateVoiceover = async () => {
    if (!timeline || busyStage) return;
    setBusyStage(`Recording ${selectedVoice} studio voiceover...`);
    setErrorMsg(null);
    try {
      const scenesPayload = timeline.scenes.map((scene) => {
        const scriptMatch = preProduction?.scriptAndCueSheet.find((c) => c.sceneId === scene.id);
        const text =
          scriptMatch?.voiceover ||
          scene.captions.map((c) => c.text).join(' ') ||
          scene.elements.find((e) => e.type === 'headline')?.content ||
          scene.title;
        return { sceneId: scene.id, text };
      });

      const voiceMeta = VOICE_OPTIONS.find((v) => v.id === selectedVoice);
      const res = await fetch('/api/studio/voiceover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenes: scenesPayload,
          voiceName: selectedVoice,
          style: voiceMeta?.tone || 'Warm, composed narrator',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Voiceover synthesis failed.');

      const clips: VoiceoverClip[] = data.clips || [];
      setVoiceoverClips(clips);

      if (activeProjectId) {
        const existing = projects.find((p) => p.id === activeProjectId);
        if (existing) {
          await persistProject({
            ...existing,
            updatedAt: new Date().toISOString(),
            mediaSelections: {
              voiceover: {
                voiceName: selectedVoice,
                style: voiceMeta?.tone || 'Warm narrator',
                model: 'gemini-3.8-flash-lite-tts',
                clips,
              },
              audio: {
                musicPreset: selectedMusic,
                bpm: MUSIC_OPTIONS.find((m) => m.id === selectedMusic)?.bpm || 96,
                musicVolume: 0.24,
                duckingDb: -14,
                sfxEnabled: true,
              },
              animationPreset: selectedMotion,
              videoPreset: selectedLook,
            },
          });
        }
      }
      showToast(`Studio voiceover recorded for ${clips.length} scenes. Press Play to listen.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyStage(null);
    }
  };

  // --- Update Music / Motion / Visual Look on Active Video ---
  const handleApplyMediaStyle = async (next: {
    musicPreset?: MusicPresetId;
    animationPreset?: AnimationPresetId;
    videoPreset?: OpenMontageVideoPresetId;
  }) => {
    const nextMusic = next.musicPreset || selectedMusic;
    const nextMotion = next.animationPreset || selectedMotion;
    const nextLook = next.videoPreset || selectedLook;

    setSelectedMusic(nextMusic);
    setSelectedMotion(nextMotion);
    setSelectedLook(nextLook);

    if (!timeline) return;
    setBusyStage('Updating video style...');
    try {
      const res = await fetch('/api/studio/media-select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeline,
          musicPreset: nextMusic,
          animationPreset: nextMotion,
          videoPreset: nextLook,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not apply style.');
      if (data.timeline) setTimeline(data.timeline);
      if (data.compiled) setCompiled(data.compiled);
      if (activeProjectId && data.timeline) {
        const existing = projects.find((p) => p.id === activeProjectId);
        if (existing) {
          await persistProject({
            ...existing,
            updatedAt: new Date().toISOString(),
            timeline: data.timeline,
            compiled: data.compiled,
            mediaSelections: {
              voiceover: {
                voiceName: selectedVoice,
                style: VOICE_OPTIONS.find((v) => v.id === selectedVoice)?.tone || 'Warm narrator',
                model: 'gemini-3.8-flash-lite-tts',
                clips: voiceoverClips,
              },
              audio: {
                musicPreset: nextMusic,
                bpm: MUSIC_OPTIONS.find((m) => m.id === nextMusic)?.bpm || 96,
                musicVolume: 0.24,
                duckingDb: -14,
                sfxEnabled: true,
              },
              animationPreset: nextMotion,
              videoPreset: nextLook,
            },
          });
        }
      }
      showToast('Video look & motion updated.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyStage(null);
    }
  };

  // --- Conversational Single-Scene Edit ---
  const handleApplySceneEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timeline || !patchInstruction.trim() || busyStage) return;
    setBusyStage('Applying your scene edit...');
    setErrorMsg(null);
    try {
      const res = await fetch('/api/studio/patch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: activeProjectId,
          timeline,
          instruction: patchInstruction,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not apply edit.');

      setTimeline(data.timeline);
      setCompiled(data.compiled);
      setLastPatchNote(data.diffSummary);
      const nextHistory = [
        {
          version: data.timeline.projectMeta.version,
          timestamp: new Date().toISOString(),
          instruction: patchInstruction,
          diffSummary: data.diffSummary,
          patchedSceneIds: data.patchedSceneIds || [],
        },
        ...editHistory,
      ];
      setEditHistory(nextHistory);
      setPatchInstruction('');
      if (data.patchedSceneIds?.[0]) setActiveSceneId(data.patchedSceneIds[0]);

      if (activeProjectId) {
        const existing = projects.find((p) => p.id === activeProjectId);
        if (existing) {
          await persistProject({
            ...existing,
            version: data.timeline.projectMeta.version,
            updatedAt: new Date().toISOString(),
            timeline: data.timeline,
            compiled: data.compiled,
            editHistory: nextHistory,
          });
        }
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyStage(null);
    }
  };

  // --- Content & Files Upload / Delete ---
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (file.size > 9 * 1024 * 1024) {
      setErrorMsg('Please choose a file under 9 MB.');
      return;
    }

    setBusyStage(`Uploading ${file.name}...`);
    setErrorMsg(null);
    try {
      const dataBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Failed to read file.'));
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          dataBase64,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed.');
      const uploaded: MediaAsset = data.asset;
      setAssets((prev) => [uploaded, ...prev]);

      if (user) {
        void saveCloudMediaAsset(user.uid, uploaded);
      }
      showToast(`Uploaded "${uploaded.name}" to Content & Files.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyStage(null);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== assetId));
    setAttachedAssetIds((prev) => prev.filter((id) => id !== assetId));
    try {
      await fetch(`/api/assets/${assetId}`, { method: 'DELETE' });
      if (user) {
        await deleteCloudMediaAsset(assetId);
      }
      showToast('File removed.');
    } catch (err) {
      console.error('Delete asset error:', err);
    }
  };

  // --- Voice Audition (Real Gemini 3.8 TTS WAV) & Music Preview ---
  const handleAuditionVoice = async (voice: (typeof VOICE_OPTIONS)[number]) => {
    if (auditioningVoice) return;
    setAuditioningVoice(voice.id);
    setErrorMsg(null);
    try {
      auditionAudioRef.current?.pause();
      const res = await fetch('/api/studio/voiceover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: voice.sampleLine,
          voiceName: voice.id,
          style: voice.tone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not audition voice.');
      if (data.audioDataUrl) {
        const audio = new Audio(data.audioDataUrl);
        auditionAudioRef.current = audio;
        await audio.play();
      }
      setSelectedVoice(voice.id);
      showToast(`Playing ${voice.id} voice sample.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setAuditioningVoice(null);
    }
  };

  const handleToggleMusicPreview = (presetId: MusicPresetId) => {
    if (!previewMusicRef.current) {
      previewMusicRef.current = new ProceduralStudioAudio();
    }
    if (playingMusicId === presetId) {
      previewMusicRef.current.stop();
      setPlayingMusicId(null);
      return;
    }
    previewMusicRef.current.start(presetId, 0.25);
    setPlayingMusicId(presetId);
    setSelectedMusic(presetId);
  };

  // --- Integrations Toggle ---
  const handleToggleIntegration = async (id: string) => {
    try {
      const res = await fetch(`/api/integrations/${id}/toggle`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setIntegrations(data.integrations || []);
        showToast(
          data.integration.connected
            ? `${data.integration.name} connected.`
            : `${data.integration.name} disconnected.`
        );
      }
    } catch (err) {
      console.error('Integration toggle error:', err);
    }
  };

  const downloadExportFile = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtered Lists
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesFilter =
        projectFilter === 'all'
          ? true
          : projectFilter === 'published'
            ? p.status === 'published'
            : p.status !== 'published';
      const matchesSearch =
        !projectSearch.trim() ||
        p.title.toLowerCase().includes(projectSearch.toLowerCase()) ||
        p.prompt.toLowerCase().includes(projectSearch.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [projects, projectFilter, projectSearch]);

  const draftCount = useMemo(() => projects.filter((p) => p.status !== 'published').length, [projects]);
  const publishedCount = useMemo(() => projects.filter((p) => p.status === 'published').length, [projects]);

  const filteredAssets = useMemo(() => {
    if (assetCategoryFilter === 'all') return assets;
    return assets.filter((a) => a.category === assetCategoryFilter);
  }, [assets, assetCategoryFilter]);

  const currentStepIndex = timeline ? 3 : preProduction ? 2 : pal ? 1 : 0;

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#09142B] text-white">
      <div>
        {/* Brand Top */}
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <button
            type="button"
            onClick={onBackToMarketing}
            className="flex items-center gap-2.5 text-left"
          >
            <MonarchLogo size={26} variant="gold" />
            <span className="font-display text-base font-bold tracking-tight text-white">
              Monarch
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-md p-1 text-slate-400 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Primary Action */}
        <div className="p-4">
          <button
            type="button"
            onClick={startFreshVideo}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-3 text-xs font-semibold text-[#09142B] transition-colors hover:bg-[#E2C258]"
          >
            <Plus className="h-4 w-4" />
            <span>New Video</span>
          </button>
        </div>

        {/* Main Workspace Nav */}
        <nav aria-label="Workspace sections" className="space-y-1 px-3">
          {(
            [
              { id: 'projects', label: 'Projects', icon: FolderOpen, count: projects.length },
              { id: 'create', label: 'Video Editor', icon: Film, count: null },
              { id: 'files', label: 'Content & Files', icon: Upload, count: assets.length },
              { id: 'models', label: 'Models & Voices', icon: Mic, count: null },
              {
                id: 'integrations',
                label: 'Integrations',
                icon: Plug,
                count: integrations.filter((i) => i.connected).length,
              },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSection(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs font-medium transition-colors ${
                  active
                    ? 'bg-white/12 text-white'
                    : 'text-slate-300 hover:bg-white/6 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${active ? 'text-[#D4AF37]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </span>
                {item.count !== null && (
                  <span className="font-mono text-[11px] tabular-nums text-slate-400">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Drafts & Published Shortcuts */}
        <div className="mt-6 border-t border-white/10 px-5 pt-5">
          <p className="text-[11px] font-medium text-slate-400">Library Views</p>
          <div className="mt-2.5 space-y-1.5 text-xs">
            <button
              type="button"
              onClick={() => {
                setProjectFilter('drafts');
                setSection('projects');
                setMobileMenuOpen(false);
              }}
              className="flex w-full items-center justify-between text-slate-300 transition-colors hover:text-white"
            >
              <span>Drafts</span>
              <span className="font-mono text-[11px] tabular-nums text-slate-400">{draftCount}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setProjectFilter('published');
                setSection('projects');
                setMobileMenuOpen(false);
              }}
              className="flex w-full items-center justify-between text-slate-300 transition-colors hover:text-white"
            >
              <span>Published</span>
              <span className="font-mono text-[11px] tabular-nums text-[#D4AF37]">{publishedCount}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar Account Footer */}
      <div className="border-t border-white/10 p-4">
        <div className="mb-3 flex items-center justify-between gap-2 text-[11px] text-slate-400">
          <button
            type="button"
            onClick={() => setDiagnosticsOpen(true)}
            className="inline-flex items-center gap-1.5 transition-colors hover:text-white"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Diagnostics</span>
          </button>
          <button
            type="button"
            onClick={onBackToMarketing}
            className="inline-flex items-center gap-1 transition-colors hover:text-white"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Website</span>
          </button>
        </div>

        {user ? (
          <div className="flex items-center justify-between gap-2 rounded-lg bg-white/8 p-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Account'}
                  referrerPolicy="no-referrer"
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#D4AF37] font-display text-xs font-bold text-[#09142B]">
                  {(user.displayName || user.email || 'M').slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white">
                  {user.displayName || 'Creator'}
                </p>
                <p className="truncate text-[10px] text-slate-400">{user.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              title="Sign out"
              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onRequestAuth('signin')}
            className="flex w-full items-center justify-between rounded-lg border border-white/15 bg-white/6 px-3 py-2.5 text-xs font-medium text-white transition-colors hover:bg-white/12"
          >
            <span className="flex items-center gap-2">
              <LogIn className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span>Sign in to sync cloud</span>
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#FAFBFD] text-slate-900">
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden w-[256px] shrink-0 lg:block">
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="w-[264px] shrink-0 shadow-2xl">{sidebarContent}</div>
          <button
            type="button"
            aria-label="Close overlay"
            onClick={() => setMobileMenuOpen(false)}
            className="flex-1 bg-slate-900/45 backdrop-blur-2xs"
          />
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Compact Workspace Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-6 backdrop-blur-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div>
              <h1 className="font-display text-base font-bold tracking-tight text-slate-900">
                {section === 'projects' && 'Projects'}
                {section === 'create' && (preProduction?.projectBrief.title || pal?.parseData.topic || 'New Video')}
                {section === 'files' && 'Content & Files'}
                {section === 'models' && 'Models & Voices'}
                {section === 'integrations' && 'Integrations'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user && cloudSynced && (
              <span className="hidden items-center gap-1.5 text-xs text-slate-500 sm:inline-flex">
                <Cloud className="h-3.5 w-3.5 text-emerald-600" />
                <span>Cloud synced</span>
              </span>
            )}
            {section === 'create' && activeProjectId && timeline && (
              <button
                type="button"
                onClick={() => {
                  const found = projects.find((p) => p.id === activeProjectId);
                  if (found) void handleTogglePublish(found);
                }}
                className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  projectStatus === 'published'
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    : 'bg-[#102D69] text-white hover:bg-[#091A3E]'
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{projectStatus === 'published' ? 'Published' : 'Publish Video'}</span>
              </button>
            )}
            {section !== 'create' && (
              <button
                type="button"
                onClick={startFreshVideo}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#102D69] px-3.5 text-xs font-semibold text-white transition-colors hover:bg-[#091A3E] whitespace-nowrap shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Video</span>
              </button>
            )}
          </div>
        </header>

        {/* Feedback Banners */}
        {toastMsg && (
          <div className="mx-6 mt-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-800">
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              {toastMsg}
            </span>
            <button type="button" onClick={() => setToastMsg(null)} className="text-emerald-700 hover:text-emerald-950">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="mx-6 mt-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-700">
            <span>{errorMsg}</span>
            <button type="button" onClick={() => setErrorMsg(null)} className="text-red-600 hover:text-red-900">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Active View Content */}
        <main className="mx-auto w-full max-w-[1280px] flex-1 px-6 py-7">
          {/* ==================== 1. PROJECTS LIBRARY ==================== */}
          {section === 'projects' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
                  {(
                    [
                      { id: 'all', label: `All (${projects.length})` },
                      { id: 'drafts', label: `Drafts (${draftCount})` },
                      { id: 'published', label: `Published (${publishedCount})` },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setProjectFilter(tab.id)}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        projectFilter === tab.id
                          ? 'bg-[#102D69] text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    placeholder="Search projects..."
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white pr-3 pl-9 text-xs text-slate-900 outline-none focus:border-[#102D69]"
                  />
                </div>
              </div>

              {filteredProjects.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
                  <Film className="mx-auto h-8 w-8 text-slate-400" />
                  <h2 className="mt-3 font-display text-base font-semibold text-slate-900">
                    No videos in this view yet
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Start a new video from plain English or switch filters to see your other cuts.
                  </p>
                  <button
                    type="button"
                    onClick={startFreshVideo}
                    className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg bg-[#102D69] px-4 text-xs font-semibold text-white hover:bg-[#091A3E]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create New Video</span>
                  </button>
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {filteredProjects.map((proj) => {
                    const isPub = proj.status === 'published';
                    return (
                      <article
                        key={proj.id}
                        className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow hover:shadow-sm"
                      >
                        <div>
                          {/* Visual Color Bar Preview */}
                          <button
                            type="button"
                            onClick={() => openProject(proj)}
                            className="group relative flex h-36 w-full flex-col justify-between p-5 text-left"
                            style={{
                              background: `linear-gradient(135deg, ${proj.brandKit?.primaryColor || '#102D69'} 0%, #09142B 100%)`,
                            }}
                          >
                            <div className="flex w-full items-center justify-between text-[11px] font-medium">
                              <span className="font-mono text-white/80">
                                {proj.aspectRatio} · {proj.durationSec}s
                              </span>
                              <span
                                className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                                  isPub
                                    ? 'bg-emerald-500/20 text-emerald-200'
                                    : 'bg-white/15 text-slate-200'
                                }`}
                              >
                                {isPub ? 'Published' : 'Draft'}
                              </span>
                            </div>
                            <div>
                              <h3 className="line-clamp-1 font-display text-lg font-bold text-white">
                                {proj.title}
                              </h3>
                              <div
                                className="mt-2 h-[2px] w-10 transition-all group-hover:w-16"
                                style={{ backgroundColor: proj.brandKit?.accentColor || '#D4AF37' }}
                              />
                            </div>
                          </button>

                          <div className="p-5">
                            <p className="line-clamp-2 text-xs leading-relaxed text-slate-600">
                              {proj.prompt}
                            </p>
                            <p className="mt-3 font-mono text-[11px] text-slate-400">
                              v{proj.version} · Updated {new Date(proj.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
                          <button
                            type="button"
                            onClick={() => openProject(proj)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#102D69] hover:text-[#091A3E]"
                          >
                            <Play className="h-3.5 w-3.5" />
                            <span>Open Editor</span>
                          </button>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => void handleTogglePublish(proj)}
                              className="rounded-md border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                            >
                              {isPub ? 'Unpublish' : 'Publish'}
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteProject(proj.id)}
                              aria-label="Delete project"
                              className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ==================== 2. ACTIVE VIDEO CREATOR / EDITOR ==================== */}
          {section === 'create' && (
            <div className="space-y-6">
              {/* Calm 3-Step Creator Progress */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-3.5">
                <div className="flex flex-wrap items-center gap-6 text-xs">
                  {[
                    { num: '01', label: 'Creative Brief', done: currentStepIndex >= 1 },
                    { num: '02', label: 'Storyboard & Script', done: currentStepIndex >= 2 },
                    { num: '03', label: 'Studio Cut & Export', done: currentStepIndex >= 3 },
                  ].map((step, i) => (
                    <div key={step.num} className="flex items-center gap-2">
                      <span
                        className={`font-mono text-[11px] font-semibold ${
                          step.done || currentStepIndex === i ? 'text-[#102D69]' : 'text-slate-400'
                        }`}
                      >
                        {step.num}
                      </span>
                      <span
                        className={
                          step.done || currentStepIndex === i
                            ? 'font-semibold text-slate-900'
                            : 'text-slate-400'
                        }
                      >
                        {step.label}
                      </span>
                      {step.done && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                    </div>
                  ))}
                </div>

                {busyStage && (
                  <span className="inline-flex items-center gap-2 text-xs font-medium text-[#102D69]">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>{busyStage}</span>
                  </span>
                )}
              </div>

              {/* Brief Composer (Always editable at top before cut, or collapsible when cut is live) */}
              {!timeline ? (
                <div className="grid gap-6 lg:grid-cols-12">
                  <form
                    onSubmit={handleCreatePlan}
                    className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-7"
                  >
                    <div>
                      <label className="block text-sm font-semibold text-slate-900">
                        What video do you want to make?
                      </label>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Describe the product, audience, mood, and call to action in plain English.
                      </p>
                      <textarea
                        rows={4}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g. A 24-second launch film introducing our matte-brass pour-over kettle..."
                        className="mt-3 w-full rounded-xl border border-slate-200 bg-[#FAFBFD] px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-[#102D69]"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700">Template</label>
                        <select
                          value={templateId}
                          onChange={(e) => setTemplateId(e.target.value)}
                          className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-800 outline-none focus:border-[#102D69]"
                        >
                          {TEMPLATES.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700">Format</label>
                        <select
                          value={aspectRatio}
                          onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                          className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-800 outline-none focus:border-[#102D69]"
                        >
                          <option value="16:9">16:9 Widescreen</option>
                          <option value="9:16">9:16 Vertical</option>
                          <option value="1:1">1:1 Square</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700">Length</label>
                        <select
                          value={durationSec}
                          onChange={(e) => setDurationSec(Number(e.target.value))}
                          className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-800 outline-none focus:border-[#102D69]"
                        >
                          <option value={18}>18 seconds (3 scenes)</option>
                          <option value={24}>24 seconds (4 scenes)</option>
                          <option value={36}>36 seconds (5 scenes)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-700">Brand Name</label>
                        <input
                          type="text"
                          value={brandKit.brandName}
                          onChange={(e) => setBrandKit((b) => ({ ...b, brandName: e.target.value }))}
                          className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-[#102D69]"
                        />
                      </div>
                      <div className="flex items-end gap-3">
                        <label className="flex flex-1 flex-col text-xs font-medium text-slate-700">
                          <span>Primary</span>
                          <input
                            type="color"
                            value={brandKit.primaryColor}
                            onChange={(e) =>
                              setBrandKit((b) => ({ ...b, primaryColor: e.target.value }))
                            }
                            className="mt-1.5 h-10 w-full cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
                          />
                        </label>
                        <label className="flex flex-1 flex-col text-xs font-medium text-slate-700">
                          <span>Accent</span>
                          <input
                            type="color"
                            value={brandKit.accentColor}
                            onChange={(e) =>
                              setBrandKit((b) => ({ ...b, accentColor: e.target.value }))
                            }
                            className="mt-1.5 h-10 w-full cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Optional Reference Files from Content & Files */}
                    {assets.length > 0 && (
                      <div className="border-t border-slate-100 pt-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-700">
                            Attach Brand Files ({attachedAssetIds.length} selected)
                          </span>
                          <button
                            type="button"
                            onClick={() => setSection('files')}
                            className="text-xs font-medium text-[#102D69] hover:underline"
                          >
                            Upload more
                          </button>
                        </div>
                        <div className="mt-2.5 flex flex-wrap gap-2">
                          {assets.slice(0, 6).map((asset) => {
                            const selected = attachedAssetIds.includes(asset.id);
                            return (
                              <button
                                key={asset.id}
                                type="button"
                                onClick={() =>
                                  setAttachedAssetIds((prev) =>
                                    prev.includes(asset.id)
                                      ? prev.filter((id) => id !== asset.id)
                                      : [...prev, asset.id]
                                  )
                                }
                                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                                  selected
                                    ? 'border-[#102D69] bg-[#EEF3FA] font-medium text-[#102D69]'
                                    : 'border-slate-200 bg-[#FAFBFD] text-slate-600 hover:bg-white'
                                }`}
                              >
                                <FileImage className="h-3.5 w-3.5" />
                                <span className="max-w-[160px] truncate">{asset.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={Boolean(busyStage)}
                      className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#102D69] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#091A3E] disabled:opacity-60"
                    >
                      {busyStage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 text-[#D4AF37]" />
                      )}
                      <span>{pal ? 'Refresh Creative Plan' : 'Draft Creative Plan'}</span>
                    </button>
                  </form>

                  {/* Right Column: Approval Checkpoints before Render */}
                  <div className="space-y-5 lg:col-span-5">
                    {!pal ? (
                      <div className="rounded-2xl border border-slate-200 bg-white p-6">
                        <p className="text-xs font-medium text-[#9A7B1C]">How it works</p>
                        <h3 className="mt-1 font-display text-lg font-bold text-slate-900">
                          You approve every creative step
                        </h3>
                        <ol className="mt-4 space-y-3 text-xs leading-relaxed text-slate-600">
                          <li>
                            <strong className="text-slate-900">1. Creative Plan:</strong> Review the
                            narrative angle, pacing, and estimated production cost before building.
                          </li>
                          <li>
                            <strong className="text-slate-900">2. Storyboard & Script:</strong> Inspect
                            every scene, on-screen headline, and voiceover line.
                          </li>
                          <li>
                            <strong className="text-slate-900">3. Studio Cut:</strong> Play with real
                            human voiceover, music, instant look changes, and single-scene edits.
                          </li>
                        </ol>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Plan Review Card */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#9A7B1C]">
                              Step 1 · Creative Plan Ready
                            </span>
                            <span className="font-mono text-xs text-slate-500">
                              {pal.semanticAnalysis.pacing}
                            </span>
                          </div>
                          <h3 className="mt-1.5 font-display text-lg font-bold text-slate-900">
                            {pal.parseData.topic}
                          </h3>
                          <p className="mt-2 text-xs leading-relaxed text-slate-600">
                            {pal.hypothesis.creativeStrategy}
                          </p>
                          <div className="mt-4 rounded-xl bg-[#FAFBFD] p-3.5 text-xs">
                            <p className="font-medium text-slate-800">Audience & Emotional Arc</p>
                            <p className="mt-1 text-slate-600">{pal.semanticAnalysis.audiencePersona}</p>
                            <p className="mt-1 text-slate-500">{pal.semanticAnalysis.emotionalArc}</p>
                          </div>

                          {!preProduction && (
                            <button
                              type="button"
                              disabled={Boolean(busyStage)}
                              onClick={() => void handleGenerateStoryboard()}
                              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#102D69] px-4 text-xs font-semibold text-white hover:bg-[#091A3E] disabled:opacity-60"
                            >
                              <span>Approve & Write Storyboard</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Storyboard Preview & Build Cut Trigger */}
                        {preProduction && (
                          <div className="rounded-2xl border border-slate-200 bg-white p-6">
                            <span className="text-xs font-semibold text-[#9A7B1C]">
                              Step 2 · Storyboard & Script ({preProduction.storyboard.length} Scenes)
                            </span>
                            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                              {preProduction.videoTreatment.logline}
                            </p>

                            <div className="mt-4 space-y-2">
                              {preProduction.storyboard.map((sc) => (
                                <div
                                  key={sc.sceneId}
                                  className="rounded-lg border border-slate-200 bg-[#FAFBFD] px-3 py-2"
                                >
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-slate-900">
                                      {sc.sceneNumber}. {sc.title}
                                    </span>
                                    <span className="font-mono text-[11px] text-slate-500">
                                      {sc.durationSec}s
                                    </span>
                                  </div>
                                  <p className="mt-0.5 text-xs text-slate-600">“{sc.onScreenText}”</p>
                                </div>
                              ))}
                            </div>

                            <button
                              type="button"
                              disabled={Boolean(busyStage)}
                              onClick={() => void handleBuildVideoCut()}
                              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#102D69] px-4 text-sm font-semibold text-white hover:bg-[#091A3E] disabled:opacity-60"
                            >
                              <Film className="h-4 w-4 text-[#D4AF37]" />
                              <span>Build Live Video Cut</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* ==================== LIVE STUDIO CUT WORKSPACE ==================== */
                <div className="space-y-6">
                  <div className="grid gap-6 lg:grid-cols-12">
                    {/* Left 8 Cols: Live Interactive Video Player + Conversational Scene Edit */}
                    <div className="space-y-4 lg:col-span-8">
                      <VideoPreviewPlayer
                        timeline={timeline}
                        hyperframesHtml={compiled?.hyperframesHtml}
                        voiceoverClips={voiceoverClips}
                        musicPreset={selectedMusic}
                        activeSceneId={activeSceneId}
                        onSelectScene={setActiveSceneId}
                      />

                      {/* Plain-English Single-Scene Edit Bar */}
                      <form
                        onSubmit={handleApplySceneEdit}
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-xs font-semibold text-slate-900">
                            Edit any scene in plain English
                          </label>
                          <span className="text-[11px] text-slate-500">
                            Changes only the scene you mention
                          </span>
                        </div>
                        <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
                          <input
                            type="text"
                            value={patchInstruction}
                            onChange={(e) => setPatchInstruction(e.target.value)}
                            placeholder="e.g. Make scene 2 headline punchier, or extend the outro by 2 seconds"
                            className="h-10 flex-1 rounded-xl border border-slate-200 bg-[#FAFBFD] px-3.5 text-xs text-slate-900 outline-none focus:border-[#102D69]"
                          />
                          <button
                            type="submit"
                            disabled={Boolean(busyStage) || !patchInstruction.trim()}
                            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#102D69] px-4 text-xs font-semibold text-white hover:bg-[#091A3E] disabled:opacity-50 whitespace-nowrap shrink-0"
                          >
                            <Send className="h-3.5 w-3.5" />
                            <span>Apply Edit</span>
                          </button>
                        </div>
                        {lastPatchNote && (
                          <p className="mt-2.5 text-xs text-emerald-700">
                            Updated: {lastPatchNote}
                          </p>
                        )}
                      </form>
                    </div>

                    {/* Right 4 Cols: Direct Voice, Music, Motion & Look Controls */}
                    <div className="space-y-4 lg:col-span-4">
                      {/* Voiceover Studio Card */}
                      <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                            <Mic className="h-3.5 w-3.5 text-[#102D69]" />
                            <span>Voiceover</span>
                          </span>
                          {voiceoverClips.length > 0 && (
                            <span className="text-[11px] font-medium text-emerald-700">
                              {voiceoverClips.length} scenes ready
                            </span>
                          )}
                        </div>
                        <select
                          value={selectedVoice}
                          onChange={(e) => setSelectedVoice(e.target.value as VoiceoverVoiceName)}
                          className="mt-3 h-9 w-full rounded-lg border border-slate-200 bg-[#FAFBFD] px-2.5 text-xs font-medium text-slate-800 outline-none focus:border-[#102D69]"
                        >
                          {VOICE_OPTIONS.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={Boolean(busyStage)}
                          onClick={() => void handleGenerateVoiceover()}
                          className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-[#102D69] px-3 text-xs font-semibold text-white hover:bg-[#091A3E] disabled:opacity-60"
                        >
                          <Volume2 className="h-3.5 w-3.5 text-[#D4AF37]" />
                          <span>
                            {voiceoverClips.length > 0 ? 'Re-Record Voiceover' : 'Generate Studio Voiceover'}
                          </span>
                        </button>
                      </div>

                      {/* Music & Motion & Look Card */}
                      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
                        <div>
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                            <Music className="h-3.5 w-3.5 text-[#102D69]" />
                            <span>Music Score</span>
                          </label>
                          <div className="mt-2 grid grid-cols-2 gap-1.5">
                            {MUSIC_OPTIONS.map((m) => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => void handleApplyMediaStyle({ musicPreset: m.id })}
                                className={`rounded-lg border px-2.5 py-2 text-left transition-colors ${
                                  selectedMusic === m.id
                                    ? 'border-[#102D69] bg-[#EEF3FA] text-[#102D69]'
                                    : 'border-slate-200 bg-[#FAFBFD] text-slate-700 hover:bg-white'
                                }`}
                              >
                                <p className="text-[11px] font-semibold">{m.label}</p>
                                <p className="text-[10px] text-slate-500">{m.bpm} BPM</p>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="border-t border-slate-100 pt-3.5">
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                            <Wand2 className="h-3.5 w-3.5 text-[#102D69]" />
                            <span>Motion Style</span>
                          </label>
                          <div className="mt-2 grid grid-cols-2 gap-1.5">
                            {MOTION_OPTIONS.map((m) => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => void handleApplyMediaStyle({ animationPreset: m.id })}
                                className={`rounded-lg border px-2.5 py-2 text-left transition-colors ${
                                  selectedMotion === m.id
                                    ? 'border-[#102D69] bg-[#EEF3FA] text-[#102D69]'
                                    : 'border-slate-200 bg-[#FAFBFD] text-slate-700 hover:bg-white'
                                }`}
                              >
                                <p className="text-[11px] font-semibold">{m.label}</p>
                                <p className="truncate text-[10px] text-slate-500">{m.note}</p>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="border-t border-slate-100 pt-3.5">
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                            <Palette className="h-3.5 w-3.5 text-[#102D69]" />
                            <span>Visual Look</span>
                          </label>
                          <div className="mt-2 grid grid-cols-2 gap-1.5">
                            {VISUAL_LOOK_OPTIONS.map((look) => (
                              <button
                                key={look.id}
                                type="button"
                                onClick={() => void handleApplyMediaStyle({ videoPreset: look.id })}
                                className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors ${
                                  selectedLook === look.id
                                    ? 'border-[#102D69] bg-[#EEF3FA] text-[#102D69]'
                                    : 'border-slate-200 bg-[#FAFBFD] text-slate-700 hover:bg-white'
                                }`}
                              >
                                <span
                                  className="h-4 w-4 shrink-0 rounded-full border border-slate-300"
                                  style={{
                                    background: `linear-gradient(135deg, ${look.swatch[0]} 50%, ${look.swatch[1]} 50%)`,
                                  }}
                                />
                                <span className="truncate text-[11px] font-semibold">{look.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Production Details Tabs (Storyboard, Script, Treatment, Export) */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                      <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
                        {(
                          [
                            { id: 'storyboard', label: 'Storyboard' },
                            { id: 'script', label: 'Script & Cues' },
                            { id: 'treatment', label: 'Creative Treatment' },
                            { id: 'export', label: 'Export & Code' },
                          ] as const
                        ).map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setDetailTab(tab.id)}
                            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                              detailTab === tab.id
                                ? 'bg-white text-[#102D69] shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={startFreshVideo}
                        className="text-xs font-medium text-slate-500 hover:text-[#102D69]"
                      >
                        Start another video
                      </button>
                    </div>

                    {detailTab === 'storyboard' && preProduction && (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {preProduction.storyboard.map((sc) => (
                          <button
                            key={sc.sceneId}
                            type="button"
                            onClick={() => setActiveSceneId(sc.sceneId)}
                            className={`rounded-xl border p-4 text-left transition-colors ${
                              activeSceneId === sc.sceneId
                                ? 'border-[#102D69] bg-[#EEF3FA]/60'
                                : 'border-slate-200 bg-[#FAFBFD] hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                              <span>Scene {sc.sceneNumber}</span>
                              <span>{sc.durationSec}s</span>
                            </div>
                            <h4 className="mt-1.5 text-sm font-semibold text-slate-900">{sc.title}</h4>
                            <p className="mt-1 text-xs font-medium text-[#102D69]">“{sc.onScreenText}”</p>
                            <p className="mt-2 text-xs leading-relaxed text-slate-600">{sc.visualFraming}</p>
                          </button>
                        ))}
                      </div>
                    )}

                    {detailTab === 'script' && preProduction && (
                      <div className="mt-4 divide-y divide-slate-100">
                        {preProduction.scriptAndCueSheet.map((cue) => (
                          <div key={cue.sceneId} className="grid gap-3 py-3 sm:grid-cols-12">
                            <div className="font-mono text-xs text-slate-500 sm:col-span-2">
                              {cue.timecode}
                            </div>
                            <div className="sm:col-span-6">
                              <p className="text-xs font-semibold text-slate-900">{cue.kineticHeadline}</p>
                              <p className="mt-1 text-xs leading-relaxed text-slate-700">“{cue.voiceover}”</p>
                            </div>
                            <div className="text-xs text-slate-500 sm:col-span-4">
                              <p>Music: {cue.musicCue}</p>
                              <p className="mt-0.5">Sound: {cue.sfxCue}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {detailTab === 'treatment' && preProduction && (
                      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="rounded-xl bg-[#FAFBFD] p-4">
                          <p className="text-[11px] font-semibold text-[#9A7B1C]">Logline</p>
                          <p className="mt-1 text-xs leading-relaxed text-slate-700">
                            {preProduction.videoTreatment.logline}
                          </p>
                        </div>
                        <div className="rounded-xl bg-[#FAFBFD] p-4">
                          <p className="text-[11px] font-semibold text-[#9A7B1C]">Visual Mood</p>
                          <p className="mt-1 text-xs leading-relaxed text-slate-700">
                            {preProduction.videoTreatment.visualMood}
                          </p>
                        </div>
                        <div className="rounded-xl bg-[#FAFBFD] p-4">
                          <p className="text-[11px] font-semibold text-[#9A7B1C]">Voice & Soundscape</p>
                          <p className="mt-1 text-xs leading-relaxed text-slate-700">
                            {preProduction.videoTreatment.voiceoverDirection} —{' '}
                            {preProduction.videoTreatment.soundscapeAndMusic}
                          </p>
                        </div>
                      </div>
                    )}

                    {detailTab === 'export' && compiled && (
                      <div className="mt-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
                            {(
                              [
                                { id: 'html', label: 'Motion HTML' },
                                { id: 'tsx', label: 'React Video (.tsx)' },
                                { id: 'json', label: 'Project JSON' },
                              ] as const
                            ).map((t) => (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => setCodeTab(t.id)}
                                className={`rounded-md px-3 py-1 text-xs font-medium ${
                                  codeTab === t.id ? 'bg-white text-[#102D69]' : 'text-slate-600'
                                }`}
                              >
                                {t.label}
                              </button>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const slug = (timeline.projectMeta.title || 'monarch-video')
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, '-');
                              if (codeTab === 'html') {
                                downloadExportFile(`${slug}.html`, compiled.hyperframesHtml, 'text/html');
                              } else if (codeTab === 'tsx') {
                                downloadExportFile(`${slug}.tsx`, compiled.remotionTsx, 'text/plain');
                              } else {
                                downloadExportFile(
                                  `${slug}.json`,
                                  JSON.stringify(timeline, null, 2),
                                  'application/json'
                                );
                              }
                            }}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#102D69] px-3 text-xs font-medium text-white hover:bg-[#091A3E]"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>Download File</span>
                          </button>
                        </div>
                        <pre className="max-h-72 overflow-auto rounded-xl bg-[#09142B] p-4 font-mono text-[11px] leading-relaxed text-slate-200">
                          {codeTab === 'html'
                            ? compiled.hyperframesHtml
                            : codeTab === 'tsx'
                              ? compiled.remotionTsx
                              : JSON.stringify(timeline, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== 3. CONTENT & FILES ==================== */}
          {section === 'files' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6">
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-900">
                    Upload Brand Assets & Media
                  </h2>
                  <p className="mt-1 text-xs text-slate-600">
                    Host your logos, product stills, voice tracks, and brand guidelines to attach directly to new videos.
                  </p>
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,audio/*,.pdf,.txt,.md,.json"
                    onChange={(e) => void handleFileSelected(e)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={Boolean(busyStage)}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#102D69] px-4 text-xs font-semibold text-white hover:bg-[#091A3E] disabled:opacity-60"
                  >
                    {busyStage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    <span>Upload File</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1 w-fit">
                {(
                  [
                    { id: 'all', label: 'All Files' },
                    { id: 'logo', label: 'Logos' },
                    { id: 'image', label: 'Images' },
                    { id: 'audio', label: 'Audio' },
                    { id: 'document', label: 'Documents' },
                  ] as const
                ).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setAssetCategoryFilter(cat.id)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      assetCategoryFilter === cat.id
                        ? 'bg-[#102D69] text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredAssets.map((asset) => {
                  const isImage = asset.mimeType.startsWith('image/');
                  const isAudio = asset.mimeType.startsWith('audio/');
                  const isAttached = attachedAssetIds.includes(asset.id);

                  return (
                    <div
                      key={asset.id}
                      className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white"
                    >
                      <div>
                        <div className="flex h-40 items-center justify-center overflow-hidden bg-slate-100">
                          {isImage ? (
                            <img
                              src={asset.url}
                              alt={asset.name}
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-cover"
                            />
                          ) : isAudio ? (
                            <div className="flex flex-col items-center gap-2 px-4">
                              <FileAudio className="h-8 w-8 text-[#102D69]" />
                              <audio controls src={asset.url} className="h-8 w-56" />
                            </div>
                          ) : (
                            <FileText className="h-8 w-8 text-slate-400" />
                          )}
                        </div>
                        <div className="p-4">
                          <p className="truncate text-sm font-semibold text-slate-900">{asset.name}</p>
                          <p className="mt-1 font-mono text-[11px] text-slate-500">
                            {asset.category} · {formatFileSize(asset.sizeBytes)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (!isAttached) {
                              setAttachedAssetIds((prev) => [...prev, asset.id]);
                            }
                            setSection('create');
                            showToast(`Attached "${asset.name}" to your video brief.`);
                          }}
                          className="text-xs font-semibold text-[#102D69] hover:underline"
                        >
                          {isAttached ? 'Attached to brief' : 'Use in video'}
                        </button>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              void navigator.clipboard.writeText(`${window.location.origin}${asset.url}`);
                              showToast('File link copied.');
                            }}
                            aria-label="Copy link"
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteAsset(asset.id)}
                            aria-label="Delete file"
                            className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================== 4. MODELS & VOICES ==================== */}
          {section === 'models' && (
            <div className="space-y-6">
              {/* Narrator Voices with Live Audition */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="font-display text-lg font-bold text-slate-900">Studio Voices</h2>
                <p className="mt-1 text-xs text-slate-600">
                  Audition natural studio voices and set your default narrator for new video projects.
                </p>

                <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {VOICE_OPTIONS.map((v) => {
                    const isDefault = selectedVoice === v.id;
                    const isBusy = auditioningVoice === v.id;
                    return (
                      <div
                        key={v.id}
                        className={`flex flex-col justify-between rounded-xl border p-4 transition-colors ${
                          isDefault ? 'border-[#102D69] bg-[#EEF3FA]/50' : 'border-slate-200 bg-[#FAFBFD]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-slate-900">{v.label}</span>
                            {isDefault && (
                              <span className="text-[11px] font-semibold text-[#102D69]">Default</span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-slate-600">{v.tone}</p>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                          <button
                            type="button"
                            disabled={Boolean(auditioningVoice)}
                            onClick={() => void handleAuditionVoice(v)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#102D69] px-3 text-xs font-medium text-white hover:bg-[#091A3E] disabled:opacity-60"
                          >
                            {isBusy ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Volume2 className="h-3.5 w-3.5" />
                            )}
                            <span>{isBusy ? 'Synthesizing...' : 'Audition Voice'}</span>
                          </button>
                          {!isDefault && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedVoice(v.id);
                                showToast(`${v.id} set as your default voice.`);
                              }}
                              className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Set Default
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Music Scores & Default Style */}
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h3 className="font-display text-base font-bold text-slate-900">
                    Original Underscore Library
                  </h3>
                  <p className="mt-1 text-xs text-slate-600">
                    Royalty-free adaptive music beds that automatically duck cleanly beneath voiceover.
                  </p>
                  <div className="mt-4 space-y-2.5">
                    {MUSIC_OPTIONS.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-[#FAFBFD] px-4 py-3"
                      >
                        <div>
                          <p className="text-xs font-semibold text-slate-900">{m.label}</p>
                          <p className="text-[11px] text-slate-500">
                            {m.note} · {m.bpm} BPM
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleMusicPreview(m.id)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Play className="h-3 w-3 text-[#102D69]" />
                          <span>{playingMusicId === m.id ? 'Stop' : 'Preview'}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Creative AI Engine Readiness (Read-only, zero browser API key inputs) */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h3 className="font-display text-base font-bold text-slate-900">
                    Creative AI Engines
                  </h3>
                  <p className="mt-1 text-xs text-slate-600">
                    Managed securely on your server or Vercel project environment so credentials never touch the browser.
                  </p>
                  <div className="mt-4 divide-y divide-slate-100">
                    {(bootstrap?.modelAdapters || []).map((adapter) => (
                      <div key={adapter.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                        <div>
                          <p className="text-xs font-semibold text-slate-900">{adapter.provider}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500">{adapter.role}</p>
                        </div>
                        <span
                          className={`shrink-0 text-xs font-medium ${
                            adapter.configuredOnServer ? 'text-emerald-700' : 'text-slate-500'
                          }`}
                        >
                          {adapter.configuredOnServer ? 'Active' : 'Gateway Ready'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 5. INTEGRATIONS ==================== */}
          {section === 'integrations' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Publishing Channels & Connected Tools
                </h2>
                <p className="mt-1 text-xs text-slate-600">
                  Connect social channels, brand storage, or external workflow tools to publish finished videos faster.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {integrations.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[11px] font-medium capitalize text-[#9A7B1C]">
                            {item.category}
                          </span>
                          <h3 className="mt-0.5 font-display text-base font-semibold text-slate-900">
                            {item.name}
                          </h3>
                        </div>
                        <span
                          className={`text-xs font-medium ${
                            item.connected ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        >
                          {item.connected ? 'Connected' : 'Not connected'}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600">
                        {item.description}
                      </p>

                      {item.endpointHint && (
                        <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-[#FAFBFD] px-3 py-2">
                          <span className="truncate font-mono text-[11px] text-slate-600">
                            {item.endpointHint}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              void navigator.clipboard.writeText(item.endpointHint || '');
                              showToast('Connector endpoint copied.');
                            }}
                            className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-[#102D69] hover:underline"
                          >
                            <Link2 className="h-3 w-3" />
                            <span>Copy</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex justify-end border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={() => void handleToggleIntegration(item.id)}
                        className={`inline-flex h-8 items-center rounded-lg px-3.5 text-xs font-semibold transition-colors ${
                          item.connected
                            ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            : 'bg-[#102D69] text-white hover:bg-[#091A3E]'
                        }`}
                      >
                        {item.connected ? 'Disconnect' : 'Connect'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Quiet Developer Diagnostics Drawer / Modal (Accessible from Sidebar Footer only) */}
      {diagnosticsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-2xs">
          <div className="relative flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-[#FAFBFD] shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <span className="font-display text-sm font-bold text-[#102D69]">
                Monarch System Diagnostics
              </span>
              <button
                type="button"
                onClick={() => setDiagnosticsOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                aria-label="Close diagnostics"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              <AgentInspectorView />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
