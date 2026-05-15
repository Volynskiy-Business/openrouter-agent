/**
 * Escalation Logic — deterministic rules-based (not model-judged in v1).
 */

import type { AgentRole, BudgetMode, EscalationResult, EscalationTrigger } from '../types.js';
import { getEscalationRoute } from './router.js';
import { isModelFree } from '../config/models.js';

export function shouldEscalate(
  trigger: EscalationTrigger,
  currentRole: AgentRole,
  budgetMode: BudgetMode,
  riskLevel: string,
): EscalationResult {
  const route = getEscalationRoute(currentRole, budgetMode, riskLevel);

  if (!route) {
    // Rule 3: No further escalation possible
    return {
      escalated: false,
      from: currentRole,
      to: null,
      trigger,
      usedPaidModel: false,
    };
  }

  // Rule 4: strict mode → never use paid model
  if (budgetMode === 'strict' && !isModelFree(route.modelId)) {
    // Try with free fallback
    return {
      escalated: true,
      from: currentRole,
      to: route.agentRole,
      trigger,
      usedPaidModel: false,
    };
  }

  return {
    escalated: true,
    from: currentRole,
    to: route.agentRole,
    trigger,
    usedPaidModel: !isModelFree(route.modelId),
  };
}
