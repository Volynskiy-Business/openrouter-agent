/**
 * Governance Tools — log_decision, show_budget, route_explain (internal).
 */

import { z } from 'zod';
import { writeAuditEntry, createAuditEntry } from '../audit/ledger.js';
import { formatBudgetReport } from '../policy/budget-enforcer.js';
import type { AgentRole, TaskType, RiskLevel, BudgetMode } from '../types.js';

export const logDecisionSchema = z.object({
  agentRole: z.string().describe('Agent role that made the decision'),
  model: z.string().describe('Model used'),
  taskType: z.string().describe('Task type'),
  riskLevel: z.string().describe('Risk level'),
  reason: z.string().describe('Routing reason'),
});

export const showBudgetSchema = z.object({});

export const routeExplainSchema = z.object({
  taskType: z.string().describe('Task type'),
  riskLevel: z.string().describe('Risk level'),
  selectedAgent: z.string().describe('Selected agent role'),
  selectedModel: z.string().describe('Selected model ID'),
  reason: z.string().describe('Why this route was chosen'),
});

export function executeLogDecision(args: z.infer<typeof logDecisionSchema>, budgetMode: BudgetMode): string {
  const entry = createAuditEntry({
    action: 'model_call',
    agentRole: args.agentRole as AgentRole,
    model: args.model,
    taskType: args.taskType as TaskType,
    riskLevel: args.riskLevel as RiskLevel,
    routingReason: args.reason,
    budgetMode,
  });
  writeAuditEntry(entry);
  return `Decision logged: ${entry.id}`;
}

export function executeShowBudget(): string {
  return formatBudgetReport();
}

export function executeRouteExplain(args: z.infer<typeof routeExplainSchema>): string {
  return [
    `Route Explanation:`,
    `  Task Type: ${args.taskType}`,
    `  Risk Level: ${args.riskLevel}`,
    `  Selected Agent: ${args.selectedAgent}`,
    `  Selected Model: ${args.selectedModel}`,
    `  Reason: ${args.reason}`,
  ].join('\n');
}
