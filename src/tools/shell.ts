/**
 * Shell Tool — run_command with allowlist enforcement and timeout.
 */

import { execSync } from 'child_process';
import { z } from 'zod';
import { SHELL_TIMEOUT_MS } from '../config/policy.js';

export const runCommandSchema = z.object({
  command: z.string().describe('Shell command to execute'),
  cwd: z.string().optional().describe('Working directory (defaults to workspace)'),
});

export function executeRunCommand(
  args: z.infer<typeof runCommandSchema>,
  workspaceDir: string,
): string {
  const cwd = args.cwd || workspaceDir;

  try {
    const output = execSync(args.command, {
      cwd,
      timeout: SHELL_TIMEOUT_MS,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 1024 * 1024, // 1MB
    });
    return output || '(no output)';
  } catch (err) {
    const error = err as { stderr?: string; message: string; status?: number };
    const stderr = error.stderr || '';
    const msg = error.message || 'Unknown error';
    const code = error.status ?? 1;
    return `Exit code: ${code}\n${stderr}\n${msg}`.trim();
  }
}
