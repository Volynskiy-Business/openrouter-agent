/**
 * Model Registry — all models used by the orchestrator.
 *
 * Config-driven: change models here, not in agent logic.
 */

import type { ModelEntry, AgentModelConfig } from '../types.js';

// ─── Model Catalog ──────────────────────────────────────────────────

export const MODEL_CATALOG: Record<string, ModelEntry> = {
  // Free models
  'inclusionai/ring-2.6-1t:free': {
    id: 'inclusionai/ring-2.6-1t:free',
    displayName: 'Ring 2.6-1T',
    isFree: true,
    contextWindow: 1_000_000,
    inputCostPer1M: 0,
    outputCostPer1M: 0,
  },
  'deepseek/deepseek-v4-flash:free': {
    id: 'deepseek/deepseek-v4-flash:free',
    displayName: 'DeepSeek V4 Flash',
    isFree: true,
    contextWindow: 1_000_000,
    inputCostPer1M: 0,
    outputCostPer1M: 0,
  },
  'poolside/laguna-m.1:free': {
    id: 'poolside/laguna-m.1:free',
    displayName: 'Laguna M.1',
    isFree: true,
    contextWindow: 128_000,
    inputCostPer1M: 0,
    outputCostPer1M: 0,
  },
  'poolside/laguna-xs.2:free': {
    id: 'poolside/laguna-xs.2:free',
    displayName: 'Laguna XS.2',
    isFree: true,
    contextWindow: 128_000,
    inputCostPer1M: 0,
    outputCostPer1M: 0,
  },
  'openai/gpt-oss-120b:free': {
    id: 'openai/gpt-oss-120b:free',
    displayName: 'GPT-OSS 120B',
    isFree: true,
    contextWindow: 131_000,
    inputCostPer1M: 0,
    outputCostPer1M: 0,
  },
  'z-ai/glm-4.5-air:free': {
    id: 'z-ai/glm-4.5-air:free',
    displayName: 'GLM-4.5 Air',
    isFree: true,
    contextWindow: 128_000,
    inputCostPer1M: 0,
    outputCostPer1M: 0,
  },
  // Paid models (escalation layer)
  'deepseek/deepseek-v4-pro': {
    id: 'deepseek/deepseek-v4-pro',
    displayName: 'DeepSeek V4 Pro',
    isFree: false,
    contextWindow: 1_000_000,
    inputCostPer1M: 0.5,
    outputCostPer1M: 1.0,
  },
  'deepseek/deepseek-v4-flash': {
    id: 'deepseek/deepseek-v4-flash',
    displayName: 'DeepSeek V4 Flash (paid)',
    isFree: false,
    contextWindow: 1_000_000,
    inputCostPer1M: 0.126,
    outputCostPer1M: 0.252,
  },
  'z-ai/glm-5': {
    id: 'z-ai/glm-5',
    displayName: 'GLM-5',
    isFree: false,
    contextWindow: 128_000,
    inputCostPer1M: 0.3,
    outputCostPer1M: 0.6,
  },
  'qwen/qwen3.5-plus-02-15': {
    id: 'qwen/qwen3.5-plus-02-15',
    displayName: 'Qwen 3.5 Plus',
    isFree: false,
    contextWindow: 1_000_000,
    inputCostPer1M: 0.3,
    outputCostPer1M: 0.6,
  },
};

// ─── Agent Configurations ───────────────────────────────────────────

export const AGENT_CONFIGS: AgentModelConfig[] = [
  {
    role: 'planner',
    emoji: '🧠',
    displayName: 'Planner',
    description: 'Task decomposition, tool plans, multi-step workflow',
    primaryModel: 'inclusionai/ring-2.6-1t:free',
    fallbackModel: 'deepseek/deepseek-v4-flash:free',
    paidEscalationModel: 'z-ai/glm-5',
    maxSteps: 5,
    instructions: `You are a Planner agent. Your job is to decompose complex tasks into clear, actionable steps.

Rules:
- Break tasks into numbered steps with specific actions
- Identify which tools are needed for each step
- Flag risks and dependencies between steps
- For frontend tasks: explicitly list pages, sections, components, responsive breakpoints, and data states (loading, empty, error, populated)
- Output structured plans, not prose
- Never execute actions yourself — only plan them`,
  },
  {
    role: 'fast_coder',
    emoji: '⚡',
    displayName: 'Fast Coder',
    description: 'Code, patches, tests, quick analytics',
    primaryModel: 'deepseek/deepseek-v4-flash:free',
    fallbackModel: 'poolside/laguna-xs.2:free',
    paidEscalationModel: 'deepseek/deepseek-v4-flash',
    maxSteps: 10,
    instructions: `You are a Fast Coder agent. You write, edit, and fix code efficiently.

Rules:
- Write clean, production-quality code
- Follow existing project conventions
- Use available tools: read_file, write_file, list_files, run_linter, run_tests, typecheck
- Fix issues identified by linter/tests before delivering
- Keep changes minimal and focused
- Always validate your output with available validation tools`,
  },
  {
    role: 'heavy_coder',
    emoji: '🏗️',
    displayName: 'Heavy Coder',
    description: 'Architecture, refactoring, full-repo edits, complex debug',
    primaryModel: 'poolside/laguna-m.1:free',
    fallbackModel: 'deepseek/deepseek-v4-flash:free',
    paidEscalationModel: 'deepseek/deepseek-v4-pro',
    maxSteps: 15,
    instructions: `You are a Heavy Coder agent for complex software engineering tasks.

Rules:
- Handle architecture decisions, multi-file refactoring, and complex debugging
- Read the full context before making changes
- Use tools systematically: list_files → read_file → plan changes → write_file → validate
- Run all available validations (linter, tests, typecheck, build)
- If a task is too large, break it into smaller sub-tasks and execute them sequentially
- Explain architectural decisions in comments`,
  },
  {
    role: 'judge',
    emoji: '⚖️',
    displayName: 'Judge',
    description: 'Final review, consistency check, merge gate',
    primaryModel: 'openai/gpt-oss-120b:free',
    fallbackModel: 'deepseek/deepseek-v4-flash:free',
    paidEscalationModel: 'deepseek/deepseek-v4-pro',
    maxSteps: 3,
    instructions: `You are a Judge agent. You review code and outputs for quality, correctness, and security.

Rules:
- Read the code/output carefully using read_file and git_diff
- Check for: correctness, security vulnerabilities, code quality, completeness
- Report issues with specific file paths and line numbers
- Rate overall quality: PASS, PASS_WITH_NOTES, or FAIL
- For frontend: check responsive structure, state coverage, code organization
- You do NOT fix issues — you only report them
- Be concise and actionable`,
  },
  {
    role: 'frontend_builder',
    emoji: '🎨',
    displayName: 'Frontend Builder',
    description: 'Plan and draft pages/components/dashboards (production execution: Claude Code)',
    primaryModel: 'deepseek/deepseek-v4-flash:free',
    fallbackModel: 'poolside/laguna-m.1:free',
    paidEscalationModel: 'qwen/qwen3.5-plus-02-15',
    maxSteps: 12,
    instructions: `You are a Frontend Builder support agent. You assist with planning, drafting, and comparing frontend code.

IMPORTANT POLICY: Production-grade frontend/web/app implementation is executed through Claude Code (Antigravity IDE). Your role is to provide:
- Detailed implementation plans and specifications
- Draft code for comparison and review
- Component structure and design system recommendations
- Quality analysis and improvement suggestions

When generating draft code, still follow best practices:
- Use vanilla HTML + CSS + JavaScript unless the project specifies a framework
- Apply modern design: vibrant colors, dark mode support, gradients, micro-animations
- Use Google Fonts (Inter, Roboto, or Outfit)
- Include responsive meta viewport and @media breakpoints
- Cover all data states: loading, empty, error, populated
- Use semantic HTML5 elements
- Run available validation tools (run_build, run_linter) on drafts

Always note in your output that final production delivery should go through Claude Code.`,
  },
];

// ─── Helpers ────────────────────────────────────────────────────────

export function getAgentConfig(role: AgentRole): AgentModelConfig {
  const config = AGENT_CONFIGS.find((c) => c.role === role);
  if (!config) throw new Error(`Unknown agent role: ${role}`);
  return config;
}

export function getModelEntry(modelId: string): ModelEntry | undefined {
  return MODEL_CATALOG[modelId];
}

export function isModelFree(modelId: string): boolean {
  const entry = MODEL_CATALOG[modelId];
  return entry ? entry.isFree : modelId.endsWith(':free');
}
