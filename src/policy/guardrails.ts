/**
 * Guardrails — pre-execution validation layer.
 */

import type { AgentRole, BudgetMode, RiskLevel } from '../types.js';
import { TOOL_SAFETY, validateShellCommand, isInsideWorkspace } from '../config/policy.js';
import { checkModelBudget } from './budget-enforcer.js';
import { isModelFree } from '../config/models.js';

export interface GuardrailCheck {
  allowed: boolean;
  reason?: string;
  requiresApproval?: boolean;
}

/** Check if a model can be used given current budget mode */
export function checkModelGuardrail(modelId: string, budgetMode: BudgetMode): GuardrailCheck {
  if (isModelFree(modelId)) return { allowed: true };

  const budgetCheck = checkModelBudget(modelId);
  if (!budgetCheck.allowed) {
    return { allowed: false, reason: budgetCheck.reason };
  }

  return { allowed: true };
}

/** Check if a tool call is allowed */
export function checkToolGuardrail(
  toolName: string,
  args: Record<string, unknown>,
  workspaceDir: string,
): GuardrailCheck {
  const safety = TOOL_SAFETY[toolName];

  if (!safety) {
    return { allowed: false, reason: `Unknown tool: ${toolName}` };
  }

  if (safety === 'blocked') {
    return { allowed: false, reason: `Tool ${toolName} is blocked by policy` };
  }

  // Shell command validation
  if (toolName === 'run_command' && typeof args.command === 'string') {
    const shellCheck = validateShellCommand(args.command);
    if (!shellCheck.allowed) {
      const reason = shellCheck.reason === 'blocklisted'
        ? `Command blocked by policy: matches blocklist entry "${shellCheck.match}"`
        : `Command blocked: not in allowlist`;
      return { allowed: false, reason };
    }
    return { allowed: true, requiresApproval: true }; // Manual: always approve
  }

  // Write file path validation
  if (toolName === 'write_file' && typeof args.path === 'string') {
    if (!isInsideWorkspace(args.path, workspaceDir)) {
      return { allowed: true, requiresApproval: true }; // HITL: outside workspace
    }
    return { allowed: true }; // Auto: inside workspace
  }

  if (safety === 'manual') {
    return { allowed: true, requiresApproval: true };
  }

  if (safety === 'hitl') {
    return { allowed: true, requiresApproval: false };
  }

  return { allowed: true };
}

/** Validate that validation tools run inside sandbox */
export function checkSandboxBoundary(
  toolName: string,
  workspaceDir: string,
  targetDir?: string,
): GuardrailCheck {
  const sandboxedTools = ['run_tests', 'run_linter', 'typecheck', 'run_build'];
  if (!sandboxedTools.includes(toolName)) return { allowed: true };

  if (targetDir && !isInsideWorkspace(targetDir, workspaceDir)) {
    return {
      allowed: false,
      reason: `Validation tool ${toolName} can only run inside workspace: ${workspaceDir}`,
    };
  }

  return { allowed: true };
}
