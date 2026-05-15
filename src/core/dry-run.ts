/**
 * Dry-Run Mode — show what the orchestrator would do without executing.
 */

import type { RoutingDecision } from '../types.js';
import { getAgentConfig } from '../config/models.js';
import { getStopConfig } from '../config/budget.js';
import { getBudgetState } from '../policy/budget-enforcer.js';

export function formatDryRun(routing: RoutingDecision, prompt: string): string {
  const config = getAgentConfig(routing.agentRole);
  const budgetState = getBudgetState();
  const stopConfig = getStopConfig(budgetState.mode, config.maxSteps);

  const lines = [
    '━━━ DRY RUN ━━━ (no actions executed)',
    '',
    `📋 Task: "${prompt.slice(0, 100)}${prompt.length > 100 ? '...' : ''}"`,
    '',
    `📊 Classification:`,
    `   Task Type: ${routing.taskType}`,
    `   Risk Level: ${routing.riskLevel}`,
    '',
    `${config.emoji} Agent: ${config.displayName}`,
    `   Model: ${routing.modelId}`,
    `   Max Steps: ${stopConfig.maxSteps}`,
    `   Max Cost: $${stopConfig.maxCostUsd.toFixed(2)}`,
    '',
    `💰 Budget: mode=${budgetState.mode}, spent=$${budgetState.todaySpendUsd.toFixed(4)}`,
    '',
    `🔍 Routing Reason: ${routing.reason}`,
    '',
    '━━━ END DRY RUN ━━━',
  ];

  return lines.join('\n');
}
