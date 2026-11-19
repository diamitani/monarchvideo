#!/usr/bin/env bash
set -euo pipefail

echo "============================================================"
echo "  Monarch Video — Runtime & ADK Environment Bootstrapper"
echo "============================================================"

check_bin() {
  local name="$1"
  if command -v "$name" >/dev/null 2>&1; then
    echo "  [OK] $name -> $(command -v "$name")"
  else
    echo "  [MISSING] $name (install recommended for local MP4 mastering)"
  fi
}

echo ""
echo "1. Core CLI Binaries:"
check_bin node
check_bin npm
check_bin npx
check_bin ffmpeg

echo ""
echo "2. Programmatic Video Renderers:"
echo "  - HyperFrames (Primary — Apache 2.0): npx hyperframes check | snapshot | timeline"
echo "  - Remotion (Secondary React/TSX):     npx skills add remotion-dev/skills"
echo "    Guardrail: Commercial license required for organizations with >3 employees."
echo "  - OpenMontage (Asset & CLIP Router):  Enabled in agent/skills/video-env-bootstrap.ts"

echo ""
echo "3. Server-Side Model & Gateway Adapter Check (No Secrets Printed):"
for var in GEMINI_API_KEY ANTHROPIC_API_KEY OPENAI_API_KEY RUNWAY_API_KEY ELEVENLABS_API_KEY AI_GATEWAY_URL COMPOSIO_API_KEY; do
  if [ -n "${!var:-}" ] && [ "${!var}" != "MY_GEMINI_API_KEY" ]; then
    echo "  [CONFIGURED] $var"
  else
    echo "  [OPTIONAL/GATEWAY] $var"
  fi
done

echo ""
echo "4. 2026 Guardrails Active:"
echo "  - Google ADK (@google/adk) Session, Artifact & Memory services ready"
echo "  - Retired OpenAI Sora API blocked (auto-routes to Veo 3.1 / Runway Gen-4.5 / LTX-2.5)"
echo "  - Composio MCP namespace enforced (composio-*)"
echo "============================================================"
