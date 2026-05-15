/**
 * Policy Configuration — allowlists, blocklists, tool safety levels.
 *
 * All dangerous-action rules live here. Change policy here, not in tool code.
 */

import type { ToolSafetyLevel } from '../types.js';

// ─── Shell Command Policy ───────────────────────────────────────────

export const SHELL_ALLOWLIST: string[] = [
  'ls', 'cat', 'find', 'grep', 'wc', 'head', 'tail', 'tree',
  'npm test', 'npm run lint', 'npm run build', 'npm run dev',
  'ruff check', 'ruff', 'pytest', 'pytest -q', 'mypy', 'tsc --noEmit', 'tsc',
  'git status', 'git diff', 'git log',
];

export const SHELL_BLOCKLIST: string[] = [
  'rm -rf', 'rm -r', 'sudo', 'chmod', 'chown', 'chgrp',
  'curl', 'wget', 'fetch', 'docker', 'podman',
  'systemctl', 'service', 'kill', 'pkill', 'killall',
  'dd', 'mkfs', 'fdisk', 'mount', 'umount',
  'env', 'export', 'source', 'eval', 'exec',
  'ssh', 'scp', 'rsync', 'nc', 'netcat', 'ncat',
  'python -c', 'node -e', 'ruby -e', 'perl -e',
];

export const SHELL_TIMEOUT_MS = 30_000;

// ─── Tool Safety Levels ─────────────────────────────────────────────

export const TOOL_SAFETY: Record<string, ToolSafetyLevel> = {
  read_file: 'auto',
  list_files: 'auto',
  git_status: 'auto',
  git_diff: 'auto',
  run_tests: 'auto',
  run_linter: 'auto',
  typecheck: 'auto',
  run_build: 'auto',
  read_preview_errors: 'auto',
  log_decision: 'auto',
  show_budget: 'auto',
  route_explain: 'auto',
  write_file: 'hitl',
  run_command: 'manual',
};

// ─── Shell Command Validation ───────────────────────────────────────

export type ShellValidationResult =
  | { allowed: true }
  | { allowed: false; reason: 'blocklisted'; match: string }
  | { allowed: false; reason: 'not_in_allowlist' };

export function validateShellCommand(command: string): ShellValidationResult {
  const trimmed = command.trim().toLowerCase();

  for (const blocked of SHELL_BLOCKLIST) {
    if (trimmed.startsWith(blocked) || trimmed.includes(` ${blocked}`) || trimmed.includes(`|${blocked}`) || trimmed.includes(`;${blocked}`)) {
      return { allowed: false, reason: 'blocklisted', match: blocked };
    }
  }

  const isAllowed = SHELL_ALLOWLIST.some((a) => trimmed.startsWith(a));
  if (!isAllowed) {
    return { allowed: false, reason: 'not_in_allowlist' };
  }

  return { allowed: true };
}

// ─── Workspace Boundary ─────────────────────────────────────────────

export function isInsideWorkspace(targetPath: string, workspaceDir: string): boolean {
  const p = targetPath.replace(/\\/g, '/');
  const w = workspaceDir.replace(/\\/g, '/');
  return p.startsWith(w);
}

export function shouldPauseWriteFile(filePath: string, workspaceDir: string): boolean {
  return !isInsideWorkspace(filePath, workspaceDir);
}
