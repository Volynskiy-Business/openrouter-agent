/**
 * Agent Core — wrapper around @openrouter/agent callModel.
 *
 * Each sub-agent is an instance configured with role-specific model and instructions.
 */

import type { AgentRole, RoutingDecision, StopConfig } from '../types.js';
import { getAgentConfig } from '../config/models.js';
import { writeAuditEntry, createAuditEntry } from '../audit/ledger.js';
import { recordSpend, getBudgetState } from '../policy/budget-enforcer.js';

export interface AgentCallResult {
  text: string;
  model: string;
  agentRole: AgentRole;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  durationMs: number;
  toolCalls: string[];
  success: boolean;
  error?: string;
}

/**
 * Execute an agent call using the OpenRouter Agent SDK.
 *
 * In v1, since @openrouter/agent package API may vary, we use a
 * compatible fetch-based approach that mirrors the callModel pattern:
 * send messages, get streaming response, handle tool calls.
 */
export async function executeAgentCall(
  routing: RoutingDecision,
  prompt: string,
  stopConfig: StopConfig,
  workspaceDir: string,
): Promise<AgentCallResult> {
  const config = getAgentConfig(routing.agentRole);
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }

  const startTime = Date.now();
  let toolCalls: string[] = [];

  try {
    // Use OpenRouter chat completions API (compatible with Agent SDK pattern)
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/Volynskiy-Business/openrouter-agent',
        'X-Title': 'OpenRouter Agent Orchestrator',
      },
      body: JSON.stringify({
        model: routing.modelId,
        messages: [
          { role: 'system', content: config.instructions },
          { role: 'user', content: prompt },
        ],
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`OpenRouter API error (${response.status}): ${errBody}`);
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
      usage?: { prompt_tokens: number; completion_tokens: number; total_cost?: number };
    };

    const text = data.choices?.[0]?.message?.content || '(no response)';
    const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0 };
    const costUsd = (data.usage as Record<string, number>)?.total_cost || 0;
    const durationMs = Date.now() - startTime;

    // Record spend
    if (costUsd > 0) {
      recordSpend(costUsd);
    }

    // Write audit entry
    const budgetState = getBudgetState();
    writeAuditEntry(createAuditEntry({
      action: 'model_call',
      agentRole: routing.agentRole,
      model: routing.modelId,
      taskType: routing.taskType,
      riskLevel: routing.riskLevel,
      routingReason: routing.reason,
      inputTokens: usage.prompt_tokens,
      outputTokens: usage.completion_tokens,
      costUsd,
      durationMs,
      toolCalls,
      success: true,
      budgetMode: budgetState.mode,
    }));

    return {
      text,
      model: routing.modelId,
      agentRole: routing.agentRole,
      inputTokens: usage.prompt_tokens,
      outputTokens: usage.completion_tokens,
      costUsd,
      durationMs,
      toolCalls,
      success: true,
    };
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const error = err instanceof Error ? err : new Error(String(err));
    const budgetState = getBudgetState();

    writeAuditEntry(createAuditEntry({
      action: 'model_call',
      agentRole: routing.agentRole,
      model: routing.modelId,
      taskType: routing.taskType,
      riskLevel: routing.riskLevel,
      routingReason: routing.reason,
      durationMs,
      success: false,
      error: error.message,
      budgetMode: budgetState.mode,
    }));

    return {
      text: '',
      model: routing.modelId,
      agentRole: routing.agentRole,
      inputTokens: 0,
      outputTokens: 0,
      costUsd: 0,
      durationMs,
      toolCalls: [],
      success: false,
      error: error.message,
    };
  }
}
