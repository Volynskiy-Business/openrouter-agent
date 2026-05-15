/**
 * Orchestrator — central hub: classify → policy check → route → execute → audit → deliver.
 *
 * Emits events for TUI reactivity (no UI logic here).
 */

import type { AgentRole, TaskType, BudgetMode } from '../types.js';
import { routeTask } from './router.js';
import { executeAgentCall, type AgentCallResult } from './agent.js';
import { formatDryRun } from './dry-run.js';
import { shouldEscalate } from './escalation.js';
import { getAgentConfig } from '../config/models.js';
import { getStopConfig } from '../config/budget.js';
import { checkModelGuardrail } from '../policy/guardrails.js';
import { getBudgetState, setBudgetMode } from '../policy/budget-enforcer.js';
import { readAuditEntries, formatAuditReport } from '../audit/reporter.js';
import { formatBudgetReport } from '../policy/budget-enforcer.js';
import { AGENT_CONFIGS } from '../config/models.js';
import { EventEmitter } from 'node:events';

// ─── Event Types ────────────────────────────────────────────────────

export type OrchestratorEventMap = {
  'status': ['idle' | 'routing' | 'executing' | 'validating' | 'escalating'];
  'agent:start': [{ role: AgentRole; model: string; emoji: string; displayName: string }];
  'agent:done': [{ role: AgentRole; success: boolean; durationMs: number }];
  'budget:update': [{ mode: BudgetMode; todaySpendUsd: number }];
};

// ─── Options ────────────────────────────────────────────────────────

export interface OrchestratorOptions {
  workspaceDir: string;
  dryRun?: boolean;
}

// ─── Class ──────────────────────────────────────────────────────────

export class Orchestrator extends EventEmitter<OrchestratorEventMap> {
  private workspaceDir: string;

  constructor(options: OrchestratorOptions) {
    super();
    this.workspaceDir = options.workspaceDir;
  }

  /** Main entry: process a user task */
  async processTask(
    prompt: string,
    options: {
      explicitTaskType?: TaskType;
      explicitAgent?: AgentRole;
      dryRun?: boolean;
    } = {},
  ): Promise<string> {
    const budgetState = getBudgetState();

    // Route
    this.emit('status', 'routing');
    const routing = routeTask(prompt, budgetState.mode, options.explicitTaskType, options.explicitAgent);

    // Dry-run check
    if (options.dryRun || process.env.DRY_RUN === 'true') {
      this.emit('status', 'idle');
      return formatDryRun(routing, prompt);
    }

    // Policy: check if model is allowed
    const modelCheck = checkModelGuardrail(routing.modelId, budgetState.mode);
    if (!modelCheck.allowed) {
      this.emit('status', 'idle');
      return `❌ Policy blocked: ${modelCheck.reason}`;
    }

    // Get stop config
    const agentConfig = getAgentConfig(routing.agentRole);
    const stopConfig = getStopConfig(budgetState.mode, agentConfig.maxSteps);

    // Execute
    this.emit('status', 'executing');
    this.emit('agent:start', {
      role: routing.agentRole,
      model: routing.modelId,
      emoji: agentConfig.emoji,
      displayName: agentConfig.displayName,
    });

    const header = `${agentConfig.emoji} [${agentConfig.displayName} | ${routing.modelId}]`;
    let result = await executeAgentCall(routing, prompt, stopConfig, this.workspaceDir);

    this.emit('agent:done', {
      role: routing.agentRole,
      success: result.success,
      durationMs: result.durationMs,
    });

    // Handle failure → escalation (rules-based)
    if (!result.success && routing.agentRole !== 'heavy_coder' && routing.agentRole !== 'judge') {
      this.emit('status', 'escalating');
      const escalation = shouldEscalate(
        'validation_failed_after_retry',
        routing.agentRole,
        budgetState.mode,
        routing.riskLevel,
      );

      if (escalation.escalated && escalation.to) {
        const escalationRouting = routeTask(prompt, budgetState.mode, routing.taskType, escalation.to);
        const escalationConfig = getAgentConfig(escalation.to);
        const escalationHeader = `${escalationConfig.emoji} [${escalationConfig.displayName} | ${escalationRouting.modelId}] (escalated from ${agentConfig.displayName})`;

        this.emit('agent:start', {
          role: escalation.to,
          model: escalationRouting.modelId,
          emoji: escalationConfig.emoji,
          displayName: escalationConfig.displayName,
        });

        result = await executeAgentCall(
          escalationRouting,
          prompt,
          getStopConfig(budgetState.mode, escalationConfig.maxSteps),
          this.workspaceDir,
        );

        this.emit('agent:done', {
          role: escalation.to,
          success: result.success,
          durationMs: result.durationMs,
        });

        if (!result.success) {
          this.emit('status', 'idle');
          return `${escalationHeader}\n❌ [ESCALATION_FAILED] Both ${agentConfig.displayName} and ${escalationConfig.displayName} failed.\nError: ${result.error}`;
        }

        this.emit('status', 'idle');
        this.emit('budget:update', { mode: getBudgetState().mode, todaySpendUsd: getBudgetState().todaySpendUsd });
        return `${escalationHeader}\n${result.text}`;
      }
    }

    this.emit('status', 'idle');
    this.emit('budget:update', { mode: getBudgetState().mode, todaySpendUsd: getBudgetState().todaySpendUsd });

    if (!result.success) {
      return `${header}\n❌ Error: ${result.error}`;
    }

    // Format output
    const meta = `\n📊 ${result.inputTokens}→${result.outputTokens} tokens | ${result.durationMs}ms | ${result.costUsd > 0 ? `$${result.costUsd.toFixed(4)}` : 'free'}`;
    return `${header}\n${result.text}${meta}`;
  }

  /** Handle governance commands */
  handleBudgetCommand(args: string): string {
    const parts = args.trim().split(/\s+/);
    if (parts[0] === 'mode' && parts[1]) {
      const mode = parts[1] as BudgetMode;
      if (!['strict', 'balanced', 'max_quality'].includes(mode)) {
        return `Invalid mode. Use: strict | balanced | max_quality`;
      }
      setBudgetMode(mode);
      this.emit('budget:update', { mode, todaySpendUsd: getBudgetState().todaySpendUsd });
      return `✅ Budget mode set to: ${mode}`;
    }
    return formatBudgetReport();
  }

  handleAuditCommand(args: string): string {
    const limit = parseInt(args.trim()) || 5;
    const entries = readAuditEntries(limit);
    return formatAuditReport(entries);
  }

  handleModelsCommand(): string {
    const lines = AGENT_CONFIGS.map((c) => {
      return `${c.emoji} ${c.displayName.padEnd(18)} │ ${c.primaryModel}`;
    });
    return ['Agent              │ Primary Model', '───────────────────┼──────────────────────────────', ...lines].join('\n');
  }
}

