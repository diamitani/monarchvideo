/**
 * LAYER 3: Tooling — Native Model Context Protocol (MCP 2026-07-28)
 *
 * Stateless JSON-RPC 2.0 MCP Server with Composio namespace policy enforcement.
 */

export const MCP_PROTOCOL_VERSION = '2026-07-28' as const;

export function assertComposioNamespace(serverNames: string[] = [], strict = true): { valid: boolean; invalid: string[] } {
  const invalid = serverNames.filter((name) => !String(name).startsWith('composio-'));
  if (strict && invalid.length > 0) {
    throw new Error(
      `ROSTR MCP policy violation: external MCP servers must use the 'composio-' prefix. Invalid: ${invalid.join(', ')}`
    );
  }
  return { valid: invalid.length === 0, invalid };
}

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (args: Record<string, unknown>) => Promise<unknown> | unknown;
}

export class MCPServer {
  name: string;
  version: string;
  private tools = new Map<string, MCPToolDefinition>();

  constructor(options: { name?: string; version?: string } = {}) {
    this.name = options.name || 'monarch-video-mcp';
    this.version = options.version || '1.0.0';
  }

  registerTool(tool: MCPToolDefinition): this {
    if (!tool.name || typeof tool.handler !== 'function') {
      throw new Error('MCP tool requires a valid name and handler function.');
    }
    this.tools.set(tool.name, tool);
    return this;
  }

  listToolManifest() {
    return Array.from(this.tools.values()).map(({ name, description, inputSchema }) => ({
      name,
      description,
      inputSchema,
    }));
  }

  async handleJsonRpc(request: {
    jsonrpc?: string;
    id?: string | number | null;
    method?: string;
    params?: Record<string, unknown>;
  }) {
    const { jsonrpc, id = null, method, params = {} } = request || {};

    if (jsonrpc !== '2.0' || !method) {
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32600, message: 'Invalid JSON-RPC 2.0 request' },
      };
    }

    try {
      if (method === 'initialize') {
        return {
          jsonrpc: '2.0',
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

      if (method === 'tools/list') {
        return {
          jsonrpc: '2.0',
          id,
          result: { tools: this.listToolManifest() },
        };
      }

      if (method === 'tools/call') {
        const toolName = String(params.name || '');
        const args = (params.arguments as Record<string, unknown>) || {};
        const tool = this.tools.get(toolName);
        if (!tool) {
          return {
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: `Unknown MCP tool: ${toolName}` },
          };
        }
        const output = await tool.handler(args);
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: typeof output === 'string' ? output : JSON.stringify(output, null, 2),
              },
            ],
            structuredContent: typeof output === 'object' ? output : { value: output },
            isError: false,
          },
        };
      }

      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Method not found: ${method}` },
      };
    } catch (err) {
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32000, message: err instanceof Error ? err.message : String(err) },
      };
    }
  }
}
