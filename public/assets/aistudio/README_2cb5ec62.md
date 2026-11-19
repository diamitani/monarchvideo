# ROSTR Agent Stack (`rostr-agent-stack`)

An open-source, protocol-first **6-layer autonomous agent stack** that decouples the reasoning model from the execution runtime using standardized open protocols—**Model Context Protocol ([MCP 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28))** for tooling and **Agent Communication Protocol ([ACP](https://research.ibm.com/projects/agent-communication-protocol) / A2A)** for multi-agent handoffs—running on a **Cloudflare Context Engine** substrate with **ROSTR**, **PAL**, **NPAO**, and the **6th Agent** meta-builder.

## Why Open Protocols?

Vendor-locked agent frameworks age poorly. `rostr-agent-stack` enforces strict separation across six modular layers so you can swap LLMs, plug in any MCP tool server, and hand off work to external agents without rewriting your runtime:

| Layer | Module | Responsibility | Open Standard / Runtime |
| --- | --- | --- | --- |
| **1. Context Substrate & Semantic Retrieval** | `packages/substrate/` | Low-latency hybrid search (lexical + Vectorize cosine via Reciprocal Rank Fusion) + **RAG DAL** credibility scoring | [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/concepts/what-are-durable-objects/) (SQLite) + [Agent Memory / Vectorize](https://blog.cloudflare.com/introducing-agent-memory) |
| **2. Reasoning & PAL** | `packages/pal/` | 5-stage **Prompt Abstraction Layer (PAL)** compiler + vendor-agnostic BYOK adapter (OpenAI, Anthropic, Gemini, Ollama, Workers AI) | Strict JSON decision contract, zero model lock-in |
| **3. Tooling (MCP)** | `packages/mcp/` | Universal tool plug exposing & consuming stateless JSON-RPC 2.0 tools with **Composio** (`composio-*`) namespace enforcement | [MCP 2026-07-28 Stateless Spec](https://modelcontextprotocol.io/specification/2026-07-28) ([Cloudflare MCP v2](https://blog.cloudflare.com/mcp-v2/)) |
| **4. Multi-Agent Handoffs (ACP + A2A)** | `packages/acp/` | RESTful sync/async agent handoffs (`/acp/agents`, `/acp/runs`) + offline `/.well-known/agent.json` discovery card | [ACP (Linux Foundation / A2A Convergence)](https://www.ibm.com/think/topics/agent-communication-protocol) |
| **5. Orchestration & Observability** | `packages/orchestrator/` | Closed-loop **NPAO** (Navigate, Prioritize, Allocate, Orchestrate) state machine + OpenTelemetry-compatible JSONL trace spans + idempotency & covenant guardrails | Deterministic state machine + span forensics |
| **6. 6th Agent Meta-Builder** | `packages/sixth-agent/` | Compiles plain-English intent into production `covenant.md`, `rostr.config.ts`, `system_prompt.txt`, `wrangler.toml`, and `.well-known/agent.json` | One-click CLI (`bin/cli.mjs`) |

## Quickstart (Zero-Dependency One-Click CLI)

Requires **Node.js 18+**. No external npm packages are required to test, run the closed-loop demo, or scaffold a new agent:

```bash
# 1. Run the automated 6-layer verification test suite
npm test

# 2. Run the closed-loop MCP + ACP + Trace Observability demo
npm run demo

# 3. Scaffold a new production-ready agent interactively via the 6th Agent CLI
npx rostr-agent-stack init

# Or scaffold non-interactively in one command:
node bin/cli.mjs init --yes \
  --name "Revenue Scout" \
  --mission "Monitor pipeline signals and prepare verified account briefs." \
  --mcps "hubspot,slack,github" \
  --provider "openai"
```

## Local HTTP Server & Cloudflare Edge Deployment

Start the local protocol server (exposes `/.well-known/agent.json`, `/mcp`, `/acp/agents`, `/acp/runs`, `/run`, and `/traces`):

```bash
npm run dev
```

Deploy the stateful **Context Engine** Durable Object + stateless **MCP 2026-07-28** Worker to Cloudflare:

```bash
cp .env.example .env
npm install
npx wrangler vectorize create rostr-context-index --dimensions=768 --metric=cosine
npm run deploy:cf
```

## Repository Structure

```text
rostr-agent-stack/
├── bin/cli.mjs                     # Zero-dependency one-click CLI (init, demo)
├── packages/
│   ├── substrate/                  # Layer 1: ContextEngine (Hybrid RRF + RAG DAL)
│   ├── pal/                        # Layer 2: 5-stage PAL Compiler + BYOK Reasoning Adapter
│   ├── mcp/                        # Layer 3: Stateless MCP 2026-07-28 Server & Client
│   ├── acp/                        # Layer 4: RESTful ACP 1.0 + A2A Discovery Router & Client
│   ├── orchestrator/               # Layer 5: NPAO Closed-Loop Harness + TraceLogger
│   └── sixth-agent/                # Layer 6: 6th Agent Meta-Builder Compiler
├── src/
│   ├── worker.ts                   # Production Cloudflare Worker + Durable Object
│   └── server.mjs                  # Local zero-dependency HTTP protocol server
├── templates/default-agent/        # Reference covenant.md, rostr.config.ts, system_prompt.txt
├── tests/verify-stack.mjs          # Automated end-to-end 6-layer verification suite
├── wrangler.toml                   # Cloudflare Workers + DO SQLite + Vectorize + Cron
└── .github/workflows/ci.yml        # GitHub Actions CI across Node 18, 20, 22
```

## License

MIT — fork it, extend it, and deploy vendor-free autonomous agents.
