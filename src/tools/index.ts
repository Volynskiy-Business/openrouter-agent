/**
 * Tool Registry — aggregates all tools with safety metadata.
 */

export { readFileSchema, writeFileSchema, listFilesSchema, executeReadFile, executeWriteFile, executeListFiles } from './filesystem.js';
export { runCommandSchema, executeRunCommand } from './shell.js';
export { gitStatusSchema, gitDiffSchema, executeGitStatus, executeGitDiff } from './git.js';
export { executeRunTests, executeRunLinter, executeTypecheck, executeRunBuild } from './validation.js';
export { readPreviewErrorsSchema, executeReadPreviewErrors } from './frontend.js';
export { logDecisionSchema, showBudgetSchema, routeExplainSchema, executeLogDecision, executeShowBudget, executeRouteExplain } from './governance.js';

/** All tool names in v1 */
export const V1_TOOLS = [
  'read_file',
  'write_file',
  'list_files',
  'run_command',
  'git_status',
  'git_diff',
  'run_tests',
  'run_linter',
  'typecheck',
  'run_build',
  'read_preview_errors',
  'log_decision',
  'show_budget',
  'route_explain',
] as const;

export type V1ToolName = (typeof V1_TOOLS)[number];
