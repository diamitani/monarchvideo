/**
 * LAYER 3: Tooling — Native Model Context Protocol (MCP 2026-07-28)
 *
 * Implements the stateless JSON-RPC 2.0 MCP 2026-07-28 contract over Streamable HTTP:
 * - Zero sticky-session overhead (runs natively in Cloudflare Workers).
 * - Enforces ROSTR's Composio MCP prefix convention (`composio-*`) for external
 *   SaaS connectors while remaining 100% open-protocol compliant.
 * - Provides both `MCPServer` (exposes ROSTR skills to external hosts like Claude,
 *   ChatGPT, Cursor, or peer agents) and `MCPClient` (invokes remote/local MCP servers).
 */

export const MCP_PROTOCOL_VERSION = "2026-07-28";

export function assertComposioNamespace(serverNames = [], strict = true) {
  const invalid = serverNames.filter((name) => !String(name).startsWith("composio-"));
  if (strict && invalid.length > 0) {
    throw new Error(
      `ROSTR MCP policy violation: external MCP servers must use the 'composio-' prefix. Invalid: ${invalid.join(", ")}`
    );
  }
  return { valid: invalid.length === 0, invalid };
}

export class MCPServer {
  constructor({ name = "rostr-mcp-server", version = "1.0.0" } = {}) {
    this.name = name;
    this.version = version;
    /** @type {Map<string, { name: string, description: string, inputSchema: object, handler: Function }>} */
    this.tools = new Map();
  }

  registerTool({ name, description, inputSchema = { type: "object", properties: {} }, handler }) {
    if (!name || typeof handler !== "function") {
      throw new Error("MCP tool requires a valid name and handler function.");
    }
    this.tools.set(name, { name, description: description || "", inputSchema, handler });
    return this;
  }

  listToolManifest() {
    return Array.from(this.tools.values()).map(({ name, description, inputSchema }) => ({
      name,
      description,
      inputSchema,
    }));
  }

  /**
   * Handle a single stateless JSON-RPC 2.0 MCP request.
   */
  async handleJsonRpc(request) {
    const { jsonrpc, id = null, method, params = {} } = request || {};

    if (jsonrpc !== "2.0" || !method) {
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32600, message: "Invalid JSON-RPC 2.0 request" },
      };
    }

    try {
      if (method === "initialize") {
        return {
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: MCP_PROTOCOL_VERSION,
            capabilities: {
              tools: { listChanged: false },
              stateless: true,
            },
            serverInfo: { name: this.name, version: this.version },
          },
        };
      }

      if (method === "tools/list") {
        return {
          jsonrpc: "2.0",
          id,
          result: { tools: this.listToolManifest() },
        };
      }

      if (method === "tools/call") {
        const { name, arguments: args = {} } = params;
        const tool = this.tools.get(name);
        if (!tool) {
          return {
            jsonrpc: "2.0",
            id,
            error: { code: -32602, message: `Unknown MCP tool: ${name}` },
          };
        }
        const output = await tool.handler(args);
        return {
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: typeof output === "string" ? output : JSON.stringify(output),
              },
            ],
            structuredContent: typeof output === "object" ? output : { value: output },
            isError: false,
          },
        };
      }

      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: `Method not found: ${method}` },
      };
    } catch (err) {
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32000, message: err instanceof Error ? err.message : String(err) },
      };
    }
  }
}

export class MCPClient {
  constructor({ localServer = null, remoteEndpoints = {}, apiKey = "" } = {}) {
    this.localServer = localServer;
    this.remoteEndpoints = remoteEndpoints;
    this.apiKey = apiKey;
    this._seq = 1;
  }

  async callTool(toolName, args = {}, endpointKey = "local") {
    const rpcPayload = {
      jsonrpc: "2.0",
      id: this._seq++,
      method: "tools/call",
      params: { name: toolName, arguments: args },
    };

    if (endpointKey === "local" && this.localServer) {
      const response = await this.localServer.handleJsonRpc(rpcPayload);
      if (response.error) {
        throw new Error(`MCP error (${response.error.code}): ${response.error.message}`);
      }
      return response.result;
    }

    const url = this.remoteEndpoints[endpointKey];
    if (!url) {
      throw new Error(`No MCP endpoint registered for key: ${endpointKey}`);
    }

    const headers = {
      "Content-Type": "application/json",
      "MCP-Protocol-Version": MCP_PROTOCOL_VERSION,
    };
    if (this.apiKey) headers["Authorization"] = `Bearer ${this.apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(rpcPayload),
    });
    if (!res.ok) throw new Error(`Remote MCP HTTP ${res.status}: ${await res.text()}`);
    const response = await res.json();
    if (response.error) {
      throw new Error(`Remote MCP error (${response.error.code}): ${response.error.message}`);
    }
    return response.result;
  }
}
