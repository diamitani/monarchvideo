export declare class SixthAgentMetaBuilder {
  compileBlueprint(input: {
    name: string;
    mission: string;
    audience?: string;
    tools?: string[];
    provider?: string;
    model?: string;
    acpPeers?: string[];
    publicUrl?: string;
  }): {
    slug: string;
    mcpServers: string[];
    files: Record<string, string>;
  };
}
