/**
 * OpenRouter Multi-Agent Orchestrator — Core Type Definitions
 *
 * All types used across the system. No runtime dependencies.
 */

// ─── Task Classification ────────────────────────────────────────────

export type TaskType =
  | 'coding'
  | 'planning'
  | 'review'
  | 'frontend_page'
  | 'frontend_dashboard'
  | 'landing_page'
  | 'general';

export type RiskLevel = 'low' | 'medium' | 'high';

export type BudgetMode = 'strict' | 'balanced' | 'max_quality';

// ─── Agent Roles ────────────────────────────────────────────────────

export type AgentRole =
  | 'planner'
  | 'fast_coder'
  | 'heavy_coder'
  | 'judge'
  | 'frontend_builder';

// ─── Model Configuration ────────────────────────────────────────────

export interface ModelEntry {
  id: string;
  displayName: string;
  isFree: boolean;
  contextWindow: number;
  /** Cost per 1M input tokens in USD. 0 for free models. */
  inputCostPer1M: number;
  /** Cost per 1M output tokens in USD. 0 for free models. */
  outputCostPer1M: number;
}

export interface AgentModelConfig {
  role: AgentRole;
  emoji: string;
  displayName: string;
  description: string;
  primaryModel: string;
  fallbackModel: string;
  paidEscalationModel: string;
  /** Max steps in the callModel agentic loop (per-agent ceiling) */
  maxSteps: number;
  /** System prompt / instructions for this agent */
  instructions: string;
}

// ─── Routing ────────────────────────────────────────────────────────

export interface RoutingDecision {
  agentRole: AgentRole;
  modelId: string;
  reason: string;
  taskType: TaskType;
  riskLevel: RiskLevel;
}

export interface RoutingRule {
  if: {
    taskType?: TaskType | TaskType[];
    riskLevel?: RiskLevel | RiskLevel[];
    contextTokensLt?: number;
    contextTokensGte?: number;
  };
  routeTo: AgentRole;
}

// ─── Escalation ─────────────────────────────────────────────────────

export type EscalationTrigger =
  | 'step_limit_hit'
  | 'validation_failed_after_retry'
  | 'heavy_coder_failed';

export interface EscalationResult {
  escalated: boolean;
  from: AgentRole;
  to: AgentRole | null;
  trigger: EscalationTrigger;
  usedPaidModel: boolean;
}

// ─── Policy ─────────────────────────────────────────────────────────

export type ToolSafetyLevel = 'auto' | 'hitl' | 'manual' | 'blocked';

export interface ToolPolicy {
  name: string;
  safetyLevel: ToolSafetyLevel;
  /** For HITL tools: condition that triggers pause */
  pauseCondition?: string;
}

// ─── Budget ─────────────────────────────────────────────────────────

export interface BudgetLimits {
  /** Per-call max steps by budget mode */
  maxStepsByMode: Record<BudgetMode, number>;
  /** Per-call max cost in USD by budget mode */
  maxCostByMode: Record<BudgetMode, number>;
  /** Daily spending limit in USD */
  dailyLimitUsd: number;
}

export interface BudgetState {
  mode: BudgetMode;
  todaySpendUsd: number;
  todayDate: string;
  totalSpendUsd: number;
  callCount: number;
}

// ─── Audit Ledger ───────────────────────────────────────────────────

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: 'model_call' | 'tool_call' | 'escalation' | 'policy_block' | 'approval_request';
  agentRole: AgentRole;
  model: string;
  taskType: TaskType;
  riskLevel: RiskLevel;
  routingReason: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  durationMs: number;
  toolCalls: string[];
  approvalRequired: boolean;
  approvalGranted: boolean | null;
  success: boolean;
  escalatedFrom: AgentRole | null;
  budgetMode: BudgetMode;
  error?: string;
}

// ─── CLI ────────────────────────────────────────────────────────────

export type CliCommand =
  | 'ask'
  | 'plan'
  | 'code'
  | 'review'
  | 'landing'
  | 'dashboard'
  | 'dry-run'
  | 'budget'
  | 'audit'
  | 'models'
  | 'help'
  | 'exit';

export interface ParsedCommand {
  command: CliCommand;
  args: string;
}

// ─── stopWhen config ────────────────────────────────────────────────

export interface StopConfig {
  maxSteps: number;
  maxCostUsd: number;
}
