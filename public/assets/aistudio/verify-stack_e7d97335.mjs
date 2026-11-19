/**
 * Automated 6-Layer Verification Suite for `rostr-agent-stack`
 *
 * Tests every architectural layer, open protocol contract (MCP 2026-07-28,
 * ACP 1.0 + A2A discovery), guardrail enforcement, idempotency, 6th Agent
 * compilation, and live HTTP server endpoints.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { ContextEngine } from "../packages/substrate/context-engine.mjs";
import { MCPServer, assertComposioNamespace, MCP_PROTOCOL_VERSION } from "../packages/mcp/mcp-protocol.mjs";
import { ACPRouter } from "../packages/acp/acp-protocol.mjs";
import { SixthAgentMetaBuilder } from "../packages/sixth-agent/meta-builder.mjs";
import { createRostrRuntime, startLocalServer } from "../src/server.mjs";

let passed = 0;

async function test(name, fn) {
  await fn();
  passed += 1;
  console.log(`  [PASS] ${name}`);
}

console.log("\nRunning ROSTR 6-Layer Agent Stack Verification Suite...\n");

// Layer 1: Context Substrate & RAG DAL Hybrid Retrieval
await test("Layer 1: ContextEngine hybrid retrieval + RAG DAL credibility ranking", async () => {
  const ce = new ContextEngine({ namespace: "test-tenant" });
  await ce.upsert({
    id: "doc-high",
    content: "Cloudflare Durable Objects and Vectorize power the ROSTR Context Engine.",
    source: "official-spec",
    trustScore: 0.99,
    pinned: true,
  });
  await ce.upsert({
    id: "doc-low",
    content: "Legacy monolithic script with stale cache snapshots.",
    source: "unverified",
    trustScore: 0.25,
  });
  const results = await ce.query("Cloudflare Context Engine Durable Objects", { topK: 2 });
  assert.equal(results[0].id, "doc-high");
  assert.ok(results[0].credibility > 0.9);
});

// Layer 3: Stateless MCP 2026-07-28 JSON-RPC 2.0 + Composio Enforcement
await test("Layer 3: Native MCP 2026-07-28 stateless JSON-RPC + Composio prefix policy", async () => {
  assert.equal(assertComposioNamespace(["composio-github", "composio-slack"]).valid, true);
  assert.throws(() => assertComposioNamespace(["raw-slack"], true));

  const server = new MCPServer({ name: "test-mcp" });
  server.registerTool({
    name: "composio_ping",
    description: "Health ping",
    handler: async ({ msg }) => ({ pong: msg }),
  });

  const initRes = await server.handleJsonRpc({ jsonrpc: "2.0", id: 1, method: "initialize" });
  assert.equal(initRes.result.protocolVersion, MCP_PROTOCOL_VERSION);
  assert.equal(initRes.result.capabilities.stateless, true);

  const callRes = await server.handleJsonRpc({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: { name: "composio_ping", arguments: { msg: "ok" } },
  });
  assert.equal(callRes.result.structuredContent.pong, "ok");
});

// Layer 4: Open ACP 1.0 + A2A Offline Discovery
await test("Layer 4: ACP sync/async runs + /.well-known/agent.json discovery", async () => {
  const router = new ACPRouter({ publicUrl: "https://agent.example.com" });
  router.registerAgent({
    name: "auditor",
    description: "Audit specialist",
    handler: async () => ({ approved: true }),
  });
  const card = router.getDiscoveryCard("auditor");
  assert.ok(card.protocols.includes("acp/1.0"));
  assert.ok(card.protocols.includes("a2a/1.0"));
  assert.ok(card.protocols.includes("mcp/2026-07-28"));

  const run = await router.createRun({ agentName: "auditor", mode: "sync" });
  assert.equal(run.status, "completed");
  assert.equal(run.output[0].parts[0].content.approved, true);
});

// Layer 2 & 5: PAL + NPAO Closed Loop + Guardrails + Idempotency + Trace Spans
await test("Layers 2 & 5: NPAO closed-loop MCP/ACP execution, guardrails, idempotency & traces", async () => {
  const runtime = createRostrRuntime({ agentName: "verify-agent", provider: "mock" });
  await runtime.substrate.upsert({
    content: "All production agents must emit OpenTelemetry-compatible trace spans.",
    source: "policy",
    trustScore: 0.95,
  });

  // 1. Guardrail block test
  const blocked = await runtime.harness.run({ intent: "Run rm -rf / on production" });
  assert.equal(blocked.status, "HALTED");

  // 2. Closed-loop MCP tool execution + idempotency replay
  const first = await runtime.harness.run({
    intent: "Search our trace logging policy",
    idempotencyKey: "idem-001",
  });
  assert.equal(first.status, "COMPLETED");
  assert.ok(first.stepsExecuted >= 2);
  assert.ok(first.spans.length >= 4);

  const replayed = await runtime.harness.run({
    intent: "Search our trace logging policy",
    idempotencyKey: "idem-001",
  });
  assert.equal(replayed.replayedFromIdempotencyCache, true);
  assert.equal(replayed.traceId, first.traceId);

  // 3. ACP multi-agent handoff
  const handoff = await runtime.harness.run({
    intent: "Delegate final review to specialist auditor",
  });
  assert.equal(handoff.status, "COMPLETED");
  assert.ok(handoff.spans.some((s) => s.name.includes("acp_handoff")));
});

// Layer 6: 6th Agent Meta-Builder + One-Click CLI Scaffold
await test("Layer 6: 6th Agent meta-builder & CLI one-click scaffolding", async () => {
  const builder = new SixthAgentMetaBuilder();
  const bp = builder.compileBlueprint({
    name: "Growth Orchestrator",
    mission: "Qualify inbound leads and sync verified briefs.",
    tools: ["hubspot", "composio-slack"],
    provider: "gemini",
  });
  assert.deepEqual(bp.mcpServers, ["composio-hubspot", "composio-slack"]);
  assert.ok(bp.files["covenant.md"].includes("Growth Orchestrator"));
  assert.ok(bp.files["rostr.config.ts"].includes("composio-hubspot"));
  assert.ok(bp.files[".well-known/agent.json"].includes("mcp/2026-07-28"));

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "rostr-cli-test-"));
  execFileSync("node", [
    path.resolve("bin/cli.mjs"),
    "init",
    "--yes",
    "--name",
    "CLI Smoke Agent",
    "--mission",
    "Verify one-click setup",
    "--mcps",
    "github,notion",
    "--out",
    tmpDir,
  ]);
  assert.ok(fs.existsSync(path.join(tmpDir, "covenant.md")));
  assert.ok(fs.existsSync(path.join(tmpDir, "rostr.config.ts")));
  assert.ok(fs.existsSync(path.join(tmpDir, "system_prompt.txt")));
  assert.ok(fs.existsSync(path.join(tmpDir, "wrangler.toml")));
  assert.ok(fs.existsSync(path.join(tmpDir, ".well-known/agent.json")));
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// End-to-End Local HTTP Server Smoke Test
await test("HTTP Gateway: /.well-known/agent.json, /mcp, /acp/runs, /run", async () => {
  const { server } = startLocalServer(0);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  try {
    const cardRes = await fetch(`${base}/.well-known/agent.json`);
    assert.equal(cardRes.status, 200);
    const card = await cardRes.json();
    assert.ok(card.endpoints.mcp.endsWith("/mcp"));

    const mcpRes = await fetch(`${base}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 10, method: "tools/list" }),
    });
    const mcpJson = await mcpRes.json();
    assert.ok(mcpJson.result.tools.length >= 1);

    const acpRes = await fetch(`${base}/acp/runs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agent_name: "specialist-auditor",
        mode: "sync",
        input: [{ role: "user", parts: [{ content_type: "text/plain", content: "verify" }] }],
      }),
    });
    const acpJson = await acpRes.json();
    assert.equal(acpJson.status, "completed");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

console.log(`\nAll ${passed} verification suites passed!\n`);
