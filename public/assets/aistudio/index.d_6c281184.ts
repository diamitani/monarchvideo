export declare const MCP_PROTOCOL_VERSION: "2026-07-28";
export declare function assertComposioNamespace(serverNames?: string[], strict?: boolean): { valid: boolean; invalid: string[] };

export declare class MCPServer {
  constructor(options?: { name?: string; version?: string });
  registerTool(tool: {
    name: string;
    description: string;
    inputSchema?: Record<string, unknown>;
    handler: (args: Record<string, unknown>) => Promise<unknown> | unknown;
  }): this;
  listToolManifest(): Array<{ name: string; description: string; inputSchema: Record<string, unknown> }>;
  handleJsonRpc(request: Record<string, unknown>): Promise<Record<string, unknown>>;
}

export declare class MCPClient {
  constructor(options?: { localServer?: MCPServer | null; remoteEndpoints?: Record<string, string>; apiKey?: string });
  callTool(toolName: string, args?: Record<string, unknown>, endpointKey?: string): Promise<Record<string, unknown>>;
}
