/**
 * Budget Enforcer — tracks spending and enforces limits.
 */

import type { BudgetMode, BudgetState } from '../types.js';
import { BUDGET_LIMITS, createInitialBudgetState } from '../config/budget.js';
import { isModelFree } from '../config/models.js';

let state: BudgetState | null = null;

function getState(): BudgetState {
  if (!state) {
    const mode = (process.env.BUDGET_MODE as BudgetMode) || 'strict';
    state = createInitialBudgetState(mode);
    const dailyLimit = parseFloat(process.env.BUDGET_LIMIT_DAILY_USD || '0');
    if (dailyLimit > 0) {
      BUDGET_LIMITS.dailyLimitUsd = dailyLimit;
    }
  }

  // Reset daily spend if new day
  const today = new Date().toISOString().slice(0, 10);
  if (state.todayDate !== today) {
    state.todayDate = today;
    state.todaySpendUsd = 0;
  }

  return state;
}

export function getBudgetState(): BudgetState {
  return { ...getState() };
}

export function setBudgetMode(mode: BudgetMode): void {
  getState().mode = mode;
}

export function recordSpend(costUsd: number): void {
  const s = getState();
  s.todaySpendUsd += costUsd;
  s.totalSpendUsd += costUsd;
  s.callCount++;
}

export function canSpend(estimatedCostUsd: number): { allowed: boolean; reason?: string } {
  const s = getState();

  if (s.mode === 'strict' && estimatedCostUsd > 0) {
    return { allowed: false, reason: 'Budget mode is strict — only free models allowed' };
  }

  const dailyLimit = BUDGET_LIMITS.dailyLimitUsd;
  if (dailyLimit > 0 && s.todaySpendUsd + estimatedCostUsd > dailyLimit) {
    return { allowed: false, reason: `Daily budget limit ($${dailyLimit}) would be exceeded` };
  }

  const maxCost = BUDGET_LIMITS.maxCostByMode[s.mode];
  if (estimatedCostUsd > maxCost && maxCost > 0) {
    return { allowed: false, reason: `Estimated cost ($${estimatedCostUsd.toFixed(4)}) exceeds per-call limit ($${maxCost})` };
  }

  return { allowed: true };
}

export function checkModelBudget(modelId: string): { allowed: boolean; reason?: string } {
  if (isModelFree(modelId)) return { allowed: true };
  return canSpend(0.01); // Minimal check — actual cost computed after call
}

export function isAtWarningThreshold(): boolean {
  const s = getState();
  const limit = BUDGET_LIMITS.dailyLimitUsd;
  if (limit <= 0) return false;
  return s.todaySpendUsd >= limit * 0.8;
}

export function formatBudgetReport(): string {
  const s = getState();
  const limit = BUDGET_LIMITS.dailyLimitUsd;
  const lines = [
    `Budget Mode: ${s.mode}`,
    `Today's Spend: $${s.todaySpendUsd.toFixed(4)}`,
    `Daily Limit: ${limit > 0 ? `$${limit.toFixed(2)}` : 'unlimited (free only)'}`,
    `Total Spend: $${s.totalSpendUsd.toFixed(4)}`,
    `Total Calls: ${s.callCount}`,
  ];
  if (isAtWarningThreshold()) {
    lines.push('⚠️  WARNING: Approaching daily budget limit (80%+)');
  }
  return lines.join('\n');
}
