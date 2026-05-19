/**
 * MCP Tools Registry
 *
 * Registers all Story MCP tools with the server.
 * Wraps server.tool() with a unified observation pipeline so every invocation
 * is recorded by both the audit JSONL writer and the signal classifier.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpConfig } from '../config.js';
import { StoryHttpClient } from '../http-client.js';
import { getObservationBus, makeObservationId, getObservationSessionId } from '../observation-bus.js';
import type { ToolObservation } from '../observation-bus.js';
import { attachAuditObserver } from '../audit.js';
import { attachSignalObserver } from '../signal-observer.js';
import { registerProjectTools } from './projects.js';
import { registerCharacterTools } from './characters.js';
import { registerFactionTools } from './factions.js';
import { registerStoryStructureTools } from './story-structure.js';
import { registerSceneTools } from './scenes.js';
import { registerImageTools } from './images.js';
import { registerWorkspaceTools } from './workspace.js';
import { registerMultimodalTools } from './multimodal.js';
import { registerVoiceTools } from './voice.js';
import { registerHistoryTools } from './history.js';
import { registerAuditTools } from './audit.js';
import { registerTemplateTools } from './templates.js';
import { registerContextPinTools } from './context-pins.js';

/** Tracked info per registered tool */
export interface ToolRegistration {
  name: string;
  hasSchema: boolean;
}

/**
 * Wrap server.tool() so every handler emits a ToolObservation to the bus.
 * The observation is consumed by all subscribers (audit writer, signal classifier,
 * and any future observers).
 */
function wrapWithObservation(server: McpServer, registrations: ToolRegistration[]): McpServer {
  const originalTool = server.tool.bind(server);
  const bus = getObservationBus();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (server as any).tool = (...args: any[]) => {
    // server.tool(name, desc, schema, handler) — handler is always last
    const toolName: string = args[0];
    // Track tool name and schema presence for validation
    if (typeof toolName === 'string') {
      const schemaArg = args.length >= 4 ? args[2] : args[1];
      const hasSchema = schemaArg != null && typeof schemaArg === 'object' && !Array.isArray(schemaArg);
      registrations.push({ name: toolName, hasSchema });
    }
    const handlerIndex = args.length - 1;
    const originalHandler = args[handlerIndex];

    if (typeof originalHandler !== 'function') {
      return (originalTool as (...a: unknown[]) => void)(...args);
    }

    // Don't observe the audit tool itself to avoid recursion
    if (toolName === 'list_tool_history') {
      return (originalTool as (...a: unknown[]) => void)(...args);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args[handlerIndex] = async (inputs: any, extra: any) => {
      const start = Date.now();
      const observationId = makeObservationId();

      try {
        const result = await originalHandler(inputs, extra);
        const durationMs = Date.now() - start;
        const isError = result?.isError === true;
        const outputText = result?.content?.[0]?.text ?? '';

        const observation: ToolObservation = {
          id: observationId,
          toolName,
          inputs: inputs ?? {},
          output: outputText,
          outputText,
          success: !isError,
          durationMs,
          error: isError ? outputText : undefined,
          timestamp: start,
          sessionId: getObservationSessionId(),
        };

        bus.emit(observation);
        return result;
      } catch (err: unknown) {
        const durationMs = Date.now() - start;
        const errMsg = err instanceof Error ? err.message : String(err);

        const observation: ToolObservation = {
          id: observationId,
          toolName,
          inputs: inputs ?? {},
          output: null,
          outputText: '',
          success: false,
          durationMs,
          error: errMsg,
          timestamp: start,
          sessionId: getObservationSessionId(),
        };

        bus.emit(observation);
        throw err;
      }
    };

    return (originalTool as (...a: unknown[]) => void)(...args);
  };

  return server;
}

/**
 * Validate tool registrations for common mistakes.
 * Logs warnings (never throws) so startup is never blocked.
 */
export function validateToolRegistration(
  registrations: ToolRegistration[],
  instructions: string,
): void {
  const warnings: string[] = [];

  // 1. Check for duplicate tool names
  const seen = new Set<string>();
  for (const reg of registrations) {
    if (seen.has(reg.name)) {
      warnings.push(`Duplicate tool name: "${reg.name}" — later registration silently overwrites the first`);
    }
    seen.add(reg.name);
  }

  // 2. Check every tool name appears in the server instructions
  for (const reg of registrations) {
    if (!instructions.includes(reg.name)) {
      warnings.push(`Tool "${reg.name}" not mentioned in server instructions — Claude may not know when to use it`);
    }
  }

  // 3. Check every tool has an input schema defined
  for (const reg of registrations) {
    if (!reg.hasSchema) {
      warnings.push(`Tool "${reg.name}" registered without an input schema object`);
    }
  }

  if (warnings.length > 0) {
    console.error(`[story-mcp] ⚠ Tool registration warnings (${warnings.length}):`);
    for (const w of warnings) {
      console.error(`  • ${w}`);
    }
  }
}

/**
 * Register all Story MCP tools
 */
export function registerTools(server: McpServer, config: McpConfig): ToolRegistration[] {
  // Set up the unified observation pipeline
  const bus = getObservationBus();
  attachAuditObserver(bus);
  attachSignalObserver(bus);

  // Wrap server.tool() to emit observations and track registrations
  const registrations: ToolRegistration[] = [];
  wrapWithObservation(server, registrations);

  // HTTP client still used for image/AI tools that call external APIs
  const client = new StoryHttpClient(config.baseUrl);

  // CRUD tools use direct Supabase access (db.ts), no HTTP client needed
  registerProjectTools(server, config);
  registerCharacterTools(server, config);
  registerFactionTools(server, config);
  registerStoryStructureTools(server, config);
  registerSceneTools(server, config);

  // Image/AI tools still use HTTP client (they wrap external APIs, not DB queries)
  registerImageTools(server, client);

  // Workspace tools are client-side only (no DB or HTTP needed)
  registerWorkspaceTools(server);

  // Multimodal tools (Gemini delegation via API routes)
  registerMultimodalTools(server);

  // Voice/narration tools (TTS generation, voice assignment, cloning)
  registerVoiceTools(server, config, client);

  // Story history tools (version control, branching, time-travel)
  registerHistoryTools(server, config);

  // Audit trail tools (query tool call history)
  registerAuditTools(server);

  // Prompt template tools (save, list, fill, delete templates)
  registerTemplateTools(server, config);

  // Context pin tools (persistent story rules engine)
  registerContextPinTools(server, config);

  const toolNames = registrations.map(r => r.name);
  console.error(`[story-mcp] Registered ${registrations.length} tools: ${toolNames.join(', ')}`);
  console.error(`[story-mcp] Observation pipeline: ${bus.subscriberCount} observers (audit + signals)`);

  return registrations;
}
