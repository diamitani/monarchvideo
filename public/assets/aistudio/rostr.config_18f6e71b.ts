// ROSTR Configuration — Default Template
export default {
  name: "ROSTR Core Agent",
  slug: "rostr-core-agent",
  mcpProtocolVersion: "2026-07-28",
  mcpServers: ["composio-github", "composio-slack", "composio-notion"],
  acp: {
    version: "1.0",
    a2aCompatible: true,
    peers: ["specialist-auditor"],
  },
  reasoning: {
    provider: "openai",
    model: "gpt-4.1-mini",
  },
};
