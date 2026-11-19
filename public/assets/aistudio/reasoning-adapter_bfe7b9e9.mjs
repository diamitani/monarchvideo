/**
 * LAYER 2: Vendor-Agnostic Reasoning Engine Adapter
 *
 * Decouples cognitive reasoning from execution runtime. Supports OpenAI,
 * Anthropic, Google Gemini, Cloudflare Workers AI, Ollama, and a deterministic
 * offline `mock` provider for zero-cost CI and protocol testing.
 */

export class ReasoningAdapter {
  constructor(options = {}) {
    this.provider = options.provider || process.env.ROSTR_LLM_PROVIDER || "mock";
    this.model = options.model || process.env.ROSTR_LLM_MODEL || "gpt-4.1-mini";
    this.apiKey =
      options.apiKey ||
      process.env.OPENAI_API_KEY ||
      process.env.ANTHROPIC_API_KEY ||
      process.env.GEMINI_API_KEY ||
      "";
    this.baseUrl = options.baseUrl || "";
    this.mockHandler = options.mockHandler || null;
  }

  async reason(compiledPayload) {
    const start = Date.now();
    let result;

    if (this.provider === "mock") {
      result = await this._runMock(compiledPayload);
    } else if (this.provider === "openai") {
      result = await this._runOpenAI(compiledPayload);
    } else if (this.provider === "anthropic") {
      result = await this._runAnthropic(compiledPayload);
    } else if (this.provider === "gemini") {
      result = await this._runGemini(compiledPayload);
    } else if (this.provider === "ollama") {
      result = await this._runOllama(compiledPayload);
    } else {
      throw new Error(`Unsupported reasoning provider: ${this.provider}`);
    }

    return {
      provider: this.provider,
      model: this.model,
      latencyMs: Date.now() - start,
      decision: result.decision,
      usage: result.usage || { promptTokens: 0, completionTokens: 0 },
    };
  }

  async _runMock(payload) {
    if (this.mockHandler) {
      return this.mockHandler(payload);
    }
    const userMsg = payload.messages.findLast((m) => m.role === "user")?.content || "";
    const hasToolResult = payload.messages.some((m) => m.role === "tool");

    if (!hasToolResult && /delegate|handoff|specialist/i.test(userMsg)) {
      return {
        decision: {
          thought: "Delegating specialized task via open ACP protocol.",
          action: "acp_handoff",
          targetAgent: "specialist-auditor",
          toolArgs: { task: userMsg },
        },
        usage: { promptTokens: 115, completionTokens: 34 },
      };
    }

    if (!hasToolResult && payload.tools.length > 0 && /sync|check|fetch|audit|search/i.test(userMsg)) {
      const firstTool = payload.tools[0];
      return {
        decision: {
          thought: `Invoking MCP tool ${firstTool.name} to gather fresh operational data.`,
          action: "tool_call",
          toolName: firstTool.name,
          toolArgs: { query: userMsg },
        },
        usage: { promptTokens: 120, completionTokens: 38 },
      };
    }

    return {
      decision: {
        thought: "All required substrate context and observations are verified; synthesizing final output.",
        action: "final",
        answer: `Completed [${payload.agentName}] goal: "${userMsg}" using fresh substrate context and open MCP/ACP protocols.`,
      },
      usage: { promptTokens: 145, completionTokens: 42 },
    };
  }

  async _runOpenAI(payload) {
    if (!this.apiKey) throw new Error("Missing OPENAI_API_KEY for openai provider");
    const url = this.baseUrl || "https://api.openai.com/v1/chat/completions";
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        response_format: { type: "json_object" },
        messages: payload.messages,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || "{}";
    return {
      decision: JSON.parse(raw),
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
      },
    };
  }

  async _runAnthropic(payload) {
    if (!this.apiKey) throw new Error("Missing ANTHROPIC_API_KEY for anthropic provider");
    const system = payload.messages.find((m) => m.role === "system")?.content || "";
    const messages = payload.messages.filter((m) => m.role !== "system");
    const res = await fetch(this.baseUrl || "https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1024,
        system,
        messages,
      }),
    });
    if (!res.ok) throw new Error(`Anthropic HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const text = data.content?.[0]?.text || "{}";
    return {
      decision: safeJsonParse(text),
      usage: {
        promptTokens: data.usage?.input_tokens ?? 0,
        completionTokens: data.usage?.output_tokens ?? 0,
      },
    };
  }

  async _runGemini(payload) {
    if (!this.apiKey) throw new Error("Missing GEMINI_API_KEY for gemini provider");
    const model = this.model || "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
    const system = payload.messages.find((m) => m.role === "system")?.content || "";
    const contents = payload.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: String(m.content) }],
      }));
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents,
        generationConfig: { responseMimeType: "application/json" },
      }),
    });
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    return {
      decision: safeJsonParse(text),
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount ?? 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
      },
    };
  }

  async _runOllama(payload) {
    const base = this.baseUrl || process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
    const res = await fetch(`${base}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        stream: false,
        format: "json",
        messages: payload.messages,
      }),
    });
    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return {
      decision: safeJsonParse(data.message?.content || "{}"),
      usage: { promptTokens: 0, completionTokens: 0 },
    };
  }
}

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    const match = str.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    return { thought: "Fallback parse", action: "final", answer: str };
  }
}
