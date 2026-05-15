/**
 * Routing Rules — JSON-driven task classification and model selection.
 *
 * Rules are evaluated top-to-bottom. First match wins.
 * Change routing here, not in orchestrator code.
 */

import type { RoutingRule, TaskType, RiskLevel, AgentRole } from '../types.js';

// ─── Routing Rules ──────────────────────────────────────────────────

export const ROUTING_RULES: RoutingRule[] = [
  // Frontend-specific routes
  {
    if: { taskType: 'landing_page' },
    routeTo: 'frontend_builder',
  },
  {
    if: { taskType: 'frontend_dashboard' },
    routeTo: 'frontend_builder',
  },
  {
    if: { taskType: 'frontend_page' },
    routeTo: 'frontend_builder',
  },
  // Planning
  {
    if: { taskType: 'planning' },
    routeTo: 'planner',
  },
  // Review / Judge
  {
    if: { taskType: 'review' },
    routeTo: 'judge',
  },
  // High-risk coding → Heavy Coder
  {
    if: { taskType: 'coding', riskLevel: 'high' },
    routeTo: 'heavy_coder',
  },
  // Large context coding → Heavy Coder
  {
    if: { taskType: 'coding', contextTokensGte: 32_000 },
    routeTo: 'heavy_coder',
  },
  // Default coding → Fast Coder
  {
    if: { taskType: 'coding' },
    routeTo: 'fast_coder',
  },
  // General fallback → Fast Coder
  {
    if: { taskType: 'general' },
    routeTo: 'fast_coder',
  },
];

// ─── Task Classification Keywords ──────────────────────────────────

interface ClassificationPattern {
  taskType: TaskType;
  riskLevel: RiskLevel;
  keywords: string[];
}

export const CLASSIFICATION_PATTERNS: ClassificationPattern[] = [
  // Frontend - landing
  {
    taskType: 'landing_page',
    riskLevel: 'medium',
    keywords: ['landing', 'landing page', 'marketing page', 'homepage', 'one-pager'],
  },
  // Frontend - dashboard
  {
    taskType: 'frontend_dashboard',
    riskLevel: 'medium',
    keywords: ['dashboard', 'admin panel', 'analytics panel', 'admin dashboard', 'control panel'],
  },
  // Frontend - general page
  {
    taskType: 'frontend_page',
    riskLevel: 'medium',
    keywords: ['frontend', 'web page', 'ui component', 'component', 'web app', 'interface'],
  },
  // Planning
  {
    taskType: 'planning',
    riskLevel: 'low',
    keywords: ['plan', 'decompose', 'break down', 'analyze', 'architect', 'design', 'strategy'],
  },
  // Review
  {
    taskType: 'review',
    riskLevel: 'low',
    keywords: ['review', 'check', 'audit', 'inspect', 'validate', 'verify', 'security'],
  },
  // High-risk coding
  {
    taskType: 'coding',
    riskLevel: 'high',
    keywords: [
      'refactor', 'migrate', 'architecture', 'rewrite', 'overhaul',
      'security', 'authentication', 'authorization', 'encryption',
      'database migration', 'schema change', 'breaking change',
    ],
  },
  // Standard coding
  {
    taskType: 'coding',
    riskLevel: 'low',
    keywords: [
      'write', 'code', 'implement', 'fix', 'bug', 'test', 'function',
      'class', 'module', 'script', 'api', 'endpoint', 'handler',
      'hello world', 'example', 'snippet', 'template', 'boilerplate',
    ],
  },
];

// ─── Classification Function ────────────────────────────────────────

export function classifyTask(
  prompt: string,
  explicitTaskType?: TaskType,
): { taskType: TaskType; riskLevel: RiskLevel } {
  // Explicit override from CLI command
  if (explicitTaskType) {
    const pattern = CLASSIFICATION_PATTERNS.find((p) => p.taskType === explicitTaskType);
    return {
      taskType: explicitTaskType,
      riskLevel: pattern?.riskLevel ?? 'low',
    };
  }

  const lower = prompt.toLowerCase();

  // Check patterns in priority order
  for (const pattern of CLASSIFICATION_PATTERNS) {
    for (const keyword of pattern.keywords) {
      if (lower.includes(keyword)) {
        return { taskType: pattern.taskType, riskLevel: pattern.riskLevel };
      }
    }
  }

  // Default
  return { taskType: 'general', riskLevel: 'low' };
}

// ─── Route Selection ────────────────────────────────────────────────

export function selectRoute(
  taskType: TaskType,
  riskLevel: RiskLevel,
  contextTokens: number = 0,
): AgentRole {
  for (const rule of ROUTING_RULES) {
    const cond = rule.if;

    // Check task type
    if (cond.taskType) {
      const types = Array.isArray(cond.taskType) ? cond.taskType : [cond.taskType];
      if (!types.includes(taskType)) continue;
    }

    // Check risk level
    if (cond.riskLevel) {
      const levels = Array.isArray(cond.riskLevel) ? cond.riskLevel : [cond.riskLevel];
      if (!levels.includes(riskLevel)) continue;
    }

    // Check context token thresholds
    if (cond.contextTokensLt !== undefined && contextTokens >= cond.contextTokensLt) continue;
    if (cond.contextTokensGte !== undefined && contextTokens < cond.contextTokensGte) continue;

    return rule.routeTo;
  }

  // Fallback
  return 'fast_coder';
}
