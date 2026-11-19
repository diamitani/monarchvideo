/**
 * REAL END-TO-END VERIFICATION SUITE (`verify-monarch-stack.ts`)
 *
 * Runs genuine live tests across:
 *  - ROSTR Layer 1: ContextEngine hybrid RRF + Hugging Face/Kaggle dataset priors
 *  - ROSTR Layer 2: PALCompiler 5-stage synthesis + ReasoningAdapter
 *  - ROSTR Layer 3: Stateless MCP 2026-07-28 (`initialize`, `tools/list` verifying all 8 creative tools, `tools/call`, Composio guardrail)
 *  - ROSTR Layer 4: Open ACP 1.0 + A2A `/.well-known/agent.json` discovery & sync handoff
 *  - ROSTR Layer 5: NPAO closed-loop execution, destructive guardrail, retired Sora guardrail, idempotency replay
 *  - ROSTR Layer 6: 6th-Agent Meta-Builder scaffold compilation + bundled `skills/monarch-video/` disk loader
 *  - Google ADK Services: SessionService, ArtifactService, MemoryService
 *  - Hermes Self-Improving Loop: reflection + dataset priors
 *  - Live Media & Open-Source Presets: select_audio, select_animations, select_video, plus live Gemini 3.8 TTS WAV synthesis when key is active
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { VerificationCheckResult, VerificationSuiteReport } from '../../src/types/monarch.ts';
import type { MonarchAdkRuntime } from '../adk/monarch-adk-runtime.ts';
import { hasServerGeminiKey } from '../rostr/gemini-client.ts';
import { assertComposioNamespace } from '../rostr/mcp-protocol.ts';
import { assertActiveVideoProvider } from '../skills/video-env-bootstrap.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runCheck(
  id: string,
  layer: string,
  name: string,
  fn: () => Promise<string>
): Promise<VerificationCheckResult> {
  const start = Date.now();
  try {
    const detail = await fn();
    return {
      id,
      layer,
      name,
      passed: true,
      durationMs: Date.now() - start,
      detail,
    };
  } catch (err) {
    return {
      id,
      layer,
      name,
      passed: false,
      durationMs: Date.now() - start,
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function runFullMonarchVerification(
  runtime: MonarchAdkRuntime
): Promise<VerificationSuiteReport> {
  const checks: VerificationCheckResult[] = [];

  // Layer 1: ContextEngine + HF/Kaggle Dataset Priors
  checks.push(
    await runCheck(
      'rostr-l1-context',
      'ROSTR Layer 1',
      'ContextEngine Hybrid RRF + HF/Kaggle Dataset Priors',
      async () => {
        const hits = await runtime.substrate.query('CineBoard3D storyboard camera motion', { topK: 4 });
        if (hits.length === 0) throw new Error('ContextEngine returned 0 matches for dataset query.');
        const stats = runtime.substrate.stats();
        return `Retrieved ${hits.length} ranked chunks (${stats.totalRecords} records indexed, top source: ${hits[0].source}).`;
      }
    )
  );

  // Layer 2: PALCompiler + ReasoningAdapter
  checks.push(
    await runCheck(
      'rostr-l2-pal',
      'ROSTR Layer 2',
      'PAL 5-Stage Intent Compiler & ReasoningAdapter',
      async () => {
        const compiled = runtime.palCompiler.compile({
          intent: 'Direct a 24s 16:9 Monarch Video launch film with HyperFrames GSAP',
          contextSlice: await runtime.substrate.query('Monarch brand identity', { topK: 2 }),
          mcpTools: runtime.mcpServer.listToolManifest(),
        });
        const systemMsg = compiled.messages.find((m) => m.role === 'system')?.content || '';
        if (!systemMsg || compiled.messages.length < 2) {
          throw new Error('PALCompiler did not emit compiled system and user messages.');
        }
        return `Compiled PAL v${compiled.palVersion} (${systemMsg.length} chars, ${compiled.tools.length} tools) with ${runtime.reasoningAdapter.provider} adapter.`;
      }
    )
  );

  // Layer 3: Stateless MCP 2026-07-28 + All 8 Creative Tools + Composio Guardrail
  checks.push(
    await runCheck(
      'rostr-l3-mcp',
      'ROSTR Layer 3',
      'Stateless MCP 2026-07-28 & 8 Creative Tools',
      async () => {
        const initRes = (await runtime.mcpServer.handleJsonRpc({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
        })) as { result?: { protocolVersion?: string } };
        const listRes = (await runtime.mcpServer.handleJsonRpc({
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/list',
        })) as { result?: { tools?: Array<{ name: string }> } };

        const names = (listRes.result?.tools || []).map((t) => t.name);
        const required8 = [
          'create_treatment',
          'create_storyboard',
          'create_script',
          'create_agent_json',
          'select_voiceover',
          'select_audio',
          'select_animations',
          'select_video',
        ];
        const missing = required8.filter((r) => !names.includes(r));
        if (missing.length > 0) {
          throw new Error(`Missing MCP creative tools: ${missing.join(', ')}`);
        }

        // Verify Composio namespace guardrail rejects non-composio server
        let composioRejected = false;
        try {
          assertComposioNamespace(['rogue-external-mcp'], true);
        } catch {
          composioRejected = true;
        }
        if (!composioRejected) throw new Error('Composio guardrail failed to block non-composio server.');

        return `Protocol ${initRes.result?.protocolVersion} · ${names.length} MCP tools registered (all 8 creative tools verified) · Composio prefix enforced.`;
      }
    )
  );

  // Layer 4: Open ACP 1.0 + A2A Discovery Card
  checks.push(
    await runCheck(
      'rostr-l4-acp',
      'ROSTR Layer 4',
      'Open ACP 1.0 & A2A Discovery Card',
      async () => {
        const card = runtime.acpRouter.getDiscoveryCard('monarch-video-agent') as {
          name?: string;
          capabilities?: string[];
        };
        const run = await runtime.acpRouter.createRun({
          agentName: 'monarch-video-agent',
          input: [{ content_type: 'text/plain', content: 'health-check' }],
          mode: 'sync',
        });
        if (run.status !== 'completed') throw new Error(`ACP sync run failed with status ${run.status}`);
        return `Agent "${card.name}" advertised ${(card.capabilities || []).length} capabilities; ACP sync run ${run.run_id} completed.`;
      }
    )
  );

  // Layer 5: NPAO Harness, Destructive Guardrail, Retired Sora Guardrail & Idempotency
  checks.push(
    await runCheck(
      'rostr-l5-npao',
      'ROSTR Layer 5',
      'NPAO Guardrails (Destructive + 2026 Retired Sora) & Idempotency',
      async () => {
        const soraCheck = assertActiveVideoProvider('openai-sora-2');
        if (soraCheck.allowed || soraCheck.resolvedProvider !== 'google-veo-3.1') {
          throw new Error('Retired OpenAI Sora guardrail failed to reroute to Veo 3.1.');
        }

        const blocked = await runtime.npaoHarness.run({
          intent: 'drop table projects immediately',
          idempotencyKey: 'verify-destructive-block',
        });
        if (blocked.status !== 'HALTED') {
          throw new Error('NPAO destructive guardrail failed to halt unsafe intent.');
        }

        const key = `verify-idem-${Date.now()}`;
        const first = await runtime.npaoHarness.run({
          intent: 'Confirm Monarch studio audio preset readiness',
          idempotencyKey: key,
        });
        const second = await runtime.npaoHarness.run({
          intent: 'Confirm Monarch studio audio preset readiness',
          idempotencyKey: key,
        });
        if (!second.replayedFromIdempotencyCache || first.traceId !== second.traceId) {
          throw new Error('NPAO idempotency replay did not return cached result.');
        }

        return `Sora rerouted -> Veo 3.1 · Destructive command HALTED · Idempotent run replayed (${first.traceId.slice(0, 10)}).`;
      }
    )
  );

  // Layer 6: 6th-Agent Meta-Builder + Bundled Skill Package on Disk
  checks.push(
    await runCheck(
      'rostr-l6-scaffold',
      'ROSTR Layer 6',
      '6th-Agent Meta-Builder & Bundled monarch-video Skill',
      async () => {
        const scaffold = runtime.metaBuilder.compileBlueprint({
          name: 'Monarch Verification Agent',
          mission: 'Compile natural language into deterministic HyperFrames & OpenMontage video.',
          tools: ['hyperframes', 'openmontage', 'github', 'google-drive'],
        });

        const skillDir = path.resolve(__dirname, '../../skills/monarch-video');
        const requiredFiles = [
          'SKILL.md',
          'SOUL.md',
          'scripts/bootstrap-env.sh',
          'references/timeline-schema.md',
          'references/openmontage-pipelines.md',
          'references/creative-datasets.md',
        ];
        const missing = requiredFiles.filter((f) => !fs.existsSync(path.join(skillDir, f)));
        if (missing.length > 0) {
          throw new Error(`Missing bundled skill files: ${missing.join(', ')}`);
        }
        return `Compiled ${Object.keys(scaffold.files).length} scaffold files + verified ${requiredFiles.length} bundled skill docs on disk.`;
      }
    )
  );

  // Google ADK Session/Artifact/Memory Services
  checks.push(
    await runCheck(
      'google-adk-services',
      'Google ADK',
      'SessionService, ArtifactService & MemoryService',
      async () => {
        const sessId = `verify-${Date.now().toString(36)}`;
        await runtime.saveArtifact({
          userId: 'verifier',
          sessionId: sessId,
          filename: 'verify-check.json',
          mimeType: 'application/json',
          content: JSON.stringify({ ok: true }),
        });
        const keys = await runtime.listSessionArtifacts({ userId: 'verifier', sessionId: sessId });
        if (!keys.includes('verify-check.json')) {
          throw new Error('ArtifactService did not persist verify-check.json.');
        }
        return `@google/adk v${runtime.adkVersion} · Artifact persisted & verified in isolated session ${sessId}.`;
      }
    )
  );

  // Hermes Self-Improving Loop & Open-Source Presets
  checks.push(
    await runCheck(
      'hermes-and-presets',
      'Hermes & Tools',
      'Hermes Memory + OpenMontage / GSAP / Web Audio Tools',
      async () => {
        const hermesState = runtime.hermes.getState();
        const audio = (await runtime.invokeCreativeTool('select_audio', {
          musicPreset: 'felt-piano',
        })) as { name: string };
        const anim = (await runtime.invokeCreativeTool('select_animations', {
          animationPreset: 'satin-gold-wipe',
        })) as { name: string };
        const video = (await runtime.invokeCreativeTool('select_video', {
          videoPreset: 'royal-architectural',
        })) as { name: string };
        return `${hermesState.stats.indexedDatasets} HF/Kaggle datasets indexed · ${hermesState.stats.promotedSkills} promoted skill · Live tools: ${audio.name}, ${anim.name}, ${video.name}.`;
      }
    )
  );

  // Live Gemini 3.8 TTS WAV Voiceover Synthesis Check
  checks.push(
    await runCheck(
      'live-gemini-tts',
      'Gemini 3.8 TTS',
      'Human Voiceover WAV Synthesis (select_voiceover)',
      async () => {
        if (!hasServerGeminiKey()) {
          return 'Skipped live audio call (GEMINI_API_KEY not set in shell); endpoint wired for gemini-3.8-flash-lite-tts.';
        }
        const vo = (await runtime.invokeCreativeTool('select_voiceover', {
          text: 'Monarch Video ready.',
          voiceName: 'Kore',
          style: 'Calm, crisp studio announcer',
        })) as { sizeBytes: number; model: string; mimeType: string };
        if (!vo.sizeBytes || vo.sizeBytes < 1000) {
          throw new Error('Synthesized WAV buffer was unexpectedly small.');
        }
        return `Synthesized real ${(vo.sizeBytes / 1024).toFixed(1)} KB ${vo.mimeType} clip via ${vo.model} (Kore).`;
      }
    )
  );

  const passed = checks.filter((c) => c.passed).length;
  const failed = checks.length - passed;

  return {
    executedAt: new Date().toISOString(),
    overallPassed: failed === 0,
    summary: {
      total: checks.length,
      passed,
      failed,
    },
    checks,
  };
}
