/**
 * Frontend Tool — read_preview_errors (parse build/preview stderr).
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';

export const readPreviewErrorsSchema = z.object({
  buildCommand: z.string().optional().describe('Build command to run (default: npm run build)'),
});

export function executeReadPreviewErrors(
  args: z.infer<typeof readPreviewErrorsSchema>,
  cwd: string,
): string {
  const command = args.buildCommand || 'npm run build';

  try {
    execSync(command, {
      cwd,
      encoding: 'utf-8',
      timeout: 60_000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return '✅ No preview errors — build succeeded.';
  } catch (err) {
    const error = err as { stderr?: string; stdout?: string };
    const stderr = error.stderr || '';
    const stdout = error.stdout || '';
    const combined = `${stderr}\n${stdout}`.trim();

    // Extract error lines
    const errorLines = combined
      .split('\n')
      .filter((line) =>
        /error|Error|ERROR|warning|Warning|WARN|failed|Failed|FAILED/i.test(line)
      );

    if (errorLines.length === 0) {
      return `❌ Build failed but no specific errors parsed:\n${combined.slice(0, 1000)}`;
    }

    return `❌ Preview errors found (${errorLines.length}):\n${errorLines.join('\n')}`;
  }
}
