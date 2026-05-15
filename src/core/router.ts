/**
 * Router — classify tasks and select agent + model.
 */

import type { RoutingDecision, TaskType, AgentRole, BudgetMode } from '../types.js';
import { classifyTask, selectRoute } from '../config/routing.js';
import { getAgentConfig, isModelFree } from '../config/models.js';
import { canUsePaidModel } from '../config/budget.js';

export function routeTask(
  prompt: string,
  budgetMode: BudgetMode,
  explicitTaskType?: TaskType,
  explicitAgent?: AgentRole,
): RoutingDecision {
  // Classify task
  const { taskType, riskLevel } = classifyTask(prompt, explicitTaskType);

  // Select agent
  const agentRole = explicitAgent || selectRoute(taskType, riskLevel);
  const agentConfig = getAgentConfig(agentRole);

  // Select model (primary free → paid if allowed)
  let modelId = agentConfig.primaryModel;
  let reason = `Task "${taskType}" (risk: ${riskLevel}) → ${agentConfig.displayName} → ${modelId}`;

  // Check if we should use paid model
  if (!isModelFree(modelId)) {
    if (!canUsePaidModel(budgetMode, riskLevel)) {
      // Fallback to free model
      modelId = agentConfig.fallbackModel || agentConfig.primaryModel;
      reason += ` (downgraded: budget mode "${budgetMode}" blocks paid models)`;
    }
  }

  return {
    agentRole,
    modelId,
    reason,
    taskType,
    riskLevel,
  };
}

/** Get fallback routing for escalation */
export function getEscalationRoute(
  currentRole: AgentRole,
  budgetMode: BudgetMode,
  riskLevel: string,
): RoutingDecision | null {
  // Rule 1 & 2: Fast Coder → Heavy Coder
  if (currentRole === 'fast_coder' || currentRole === 'frontend_builder') {
    const heavyConfig = getAgentConfig('heavy_coder');
    let modelId = heavyConfig.primaryModel;

    // Check if paid escalation is allowed
    if (canUsePaidModel(budgetMode, riskLevel)) {
      modelId = heavyConfig.paidEscalationModel;
    }

    return {
      agentRole: 'heavy_coder',
      modelId,
      reason: `Escalated from ${currentRole}: retry with Heavy Coder`,
      taskType: 'coding',
      riskLevel: riskLevel as 'low' | 'medium' | 'high',
    };
  }

  // Rule 3: Heavy Coder failed → no further escalation
  return null;
}
