/**
 * Git Tools — git_status, git_diff (read-only in v1).
 */

import { execSync } from 'child_process';
import { z } from 'zod';

export const gitStatusSchema = z.object({});
export const gitDiffSchema = z.object({
  path: z.string().optional().describe('Specific file path to diff'),
});

function gitExec(command: string, cwd: string): string {
  try {
    return execSync(command, { cwd, encoding: 'utf-8', timeout: 10_000 }).trim();
  } catch (err) {
    return `Git error: ${(err as Error).message}`;
  }
}

export function executeGitStatus(cwd: string): string {
  const output = gitExec('git status --short', cwd);
  return output || '(working tree clean)';
}

export function executeGitDiff(args: z.infer<typeof gitDiffSchema>, cwd: string): string {
  const cmd = args.path ? `git diff -- ${args.path}` : 'git diff';
  const output = gitExec(cmd, cwd);
  return output || '(no changes)';
}
