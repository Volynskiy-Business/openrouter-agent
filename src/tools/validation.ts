/**
 * Validation Tools — run_tests, run_linter, typecheck, run_build.
 *
 * All execute ONLY inside the project workspace (sandbox boundary).
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';

export const validationSchema = z.object({});

function runValidation(command: string, cwd: string, label: string): string {
  try {
    const output = execSync(command, {
      cwd,
      encoding: 'utf-8',
      timeout: 60_000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return `✅ ${label}: passed\n${output}`.trim();
  } catch (err) {
    const error = err as { stdout?: string; stderr?: string; status?: number };
    const output = (error.stdout || '') + '\n' + (error.stderr || '');
    return `❌ ${label}: failed (exit ${error.status})\n${output}`.trim();
  }
}

function detectRunner(cwd: string): 'node' | 'python' | 'unknown' {
  if (existsSync(join(cwd, 'package.json'))) return 'node';
  if (existsSync(join(cwd, 'pyproject.toml')) || existsSync(join(cwd, 'setup.py'))) return 'python';
  return 'unknown';
}

export function executeRunTests(cwd: string): string {
  const runner = detectRunner(cwd);
  if (runner === 'node') return runValidation('npm test', cwd, 'Tests');
  if (runner === 'python') return runValidation('pytest -q', cwd, 'Tests');
  return '⚠️ No test runner detected (no package.json or pyproject.toml)';
}

export function executeRunLinter(cwd: string): string {
  const runner = detectRunner(cwd);
  if (runner === 'node') return runValidation('npm run lint', cwd, 'Linter');
  if (runner === 'python') return runValidation('ruff check .', cwd, 'Linter');
  return '⚠️ No linter detected';
}

export function executeTypecheck(cwd: string): string {
  const runner = detectRunner(cwd);
  if (runner === 'node') return runValidation('npx tsc --noEmit', cwd, 'Typecheck');
  if (runner === 'python') return runValidation('mypy .', cwd, 'Typecheck');
  return '⚠️ No type checker detected';
}

export function executeRunBuild(cwd: string): string {
  const runner = detectRunner(cwd);
  if (runner === 'node') return runValidation('npm run build', cwd, 'Build');
  return '⚠️ No build command detected';
}
