# ROSTR + Google ADK Backend Agent Stack (`rostr-agent-stack.md`)

Monarch Video combines **Google ADK (`@google/adk`)** (`LlmAgent`, `SequentialAgent`, `FunctionTool`, `Runner`, `SessionService`, `ArtifactService`, `MemoryService`) with the **ROSTR 6-Layer Open-Protocol Stack** (ContextEngine Hybrid RRF + RAG DAL, 5-Stage PAL, Stateless MCP `2026-07-28`, ACP `1.0` + A2A Discovery, and OpenTelemetry-compatible Trace Spans).

## Open-Protocol & ADK Endpoints

| Endpoint | Protocol / Service | Purpose |
| --- | --- | --- |
| `GET /.well-known/agent.json` | ACP 1.0 + A2A + MCP 2026-07-28 | Offline discovery manifest for peer agents |
| `POST /mcp` | Stateless JSON-RPC 2.0 MCP | `initialize`, `tools/list`, `tools/call` (`composio-*`) |
| `GET /acp/agents` & `POST /acp/runs` | Open ACP 1.0 | Sync/async multi-agent handoffs |
| `POST /api/adk/chat` | Google ADK `Runner` | Runs `monarch_video_orchestrator` with Zod `FunctionTool`s |
| `GET /api/adk/artifacts/:sessionId` | Google ADK `ArtifactService` | Lists versioned `pal-brief.json`, `preproduction.json`, `timeline.json`, `hyperframes.html`, `remotion.tsx` |
| `POST /api/studio/pal` | Sub-Skill B (`pal-video-compiler`) | 4-stage PAL extraction + runtime & cost estimate |
| `POST /api/studio/preproduction` | Sub-Skill C (`artistic-director-suite`) | Brief, Brand/Template, Treatment, Storyboard, Script |
| `POST /api/studio/compile` | Sub-Skill D (`editor-json-translator`) | Validated Timeline JSON + HyperFrames & Remotion code |
| `POST /api/studio/patch` | Conversational Diff Loop | Scoped non-destructive `TimelinePatch` on targeted scenes |

## Composio MCP Policy

All external SaaS connectors must carry the `composio-` namespace prefix:
- `composio-github`
- `composio-google-drive`
- `composio-youtube`
- `composio-slack`
- `composio-notion`
