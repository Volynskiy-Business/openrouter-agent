/**
 * Budget Configuration — modes, limits, thresholds.
 */

import type { BudgetMode, BudgetLimits, BudgetState, StopConfig } from '../types.js';

// ─── Budget Limits by Mode ──────────────────────────────────────────

export const BUDGET_LIMITS: BudgetLimits = {
  maxStepsByMode: {
    strict: 10,
    balanced: 15,
    max_quality: 20,
  },
  maxCostByMode: {
    strict: 0,
    balanced: 0.5,
    max_quality: 2.0,
  },
  dailyLimitUsd: 0,
};

// ─── Initial Budget State ───────────────────────────────────────────

export function createInitialBudgetState(mode: BudgetMode): BudgetState {
  return {
    mode,
    todaySpendUsd: 0,
    todayDate: new Date().toISOString().slice(0, 10),
    totalSpendUsd: 0,
    callCount: 0,
  };
}

// ─── Stop Config for Agent Calls ────────────────────────────────────

export function getStopConfig(mode: BudgetMode, agentMaxSteps: number): StopConfig {
  const modeMaxSteps = BUDGET_LIMITS.maxStepsByMode[mode];
  return {
    maxSteps: Math.min(agentMaxSteps, modeMaxSteps),
    maxCostUsd: BUDGET_LIMITS.maxCostByMode[mode],
  };
}

// ─── Can Use Paid Model? ────────────────────────────────────────────

export function canUsePaidModel(mode: BudgetMode, riskLevel: string): boolean {
  if (mode === 'strict') return false;
  if (mode === 'balanced') return riskLevel === 'high';
  if (mode === 'max_quality') return true;
  return false;
}
