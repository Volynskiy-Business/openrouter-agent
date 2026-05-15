/**
 * Policy Tests — verify shell validation, workspace boundary, tool safety.
 */

import { describe, it, expect } from 'vitest';
import { validateShellCommand, isInsideWorkspace, shouldPauseWriteFile } from '../src/config/policy.js';

describe('validateShellCommand', () => {
  it('allows allowlisted commands', () => {
    expect(validateShellCommand('ls -la')).toEqual({ allowed: true });
    expect(validateShellCommand('git status')).toEqual({ allowed: true });
    expect(validateShellCommand('npm test')).toEqual({ allowed: true });
    expect(validateShellCommand('pytest -q')).toEqual({ allowed: true });
  });

  it('blocks blocklisted commands', () => {
    const result = validateShellCommand('rm -rf /');
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toBe('blocklisted');
  });

  it('blocks sudo', () => {
    const result = validateShellCommand('sudo apt install something');
    expect(result.allowed).toBe(false);
  });

  it('blocks curl', () => {
    const result = validateShellCommand('curl https://evil.com');
    expect(result.allowed).toBe(false);
  });

  it('blocks unknown commands', () => {
    const result = validateShellCommand('custom-unknown-cmd --flag');
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toBe('not_in_allowlist');
  });

  it('blocks piped blocklist commands', () => {
    const result = validateShellCommand('ls |rm -rf /');
    expect(result.allowed).toBe(false);
  });
});

describe('isInsideWorkspace', () => {
  it('returns true for paths inside workspace', () => {
    expect(isInsideWorkspace('/opt/project/src/file.ts', '/opt/project')).toBe(true);
  });

  it('returns false for paths outside workspace', () => {
    expect(isInsideWorkspace('/etc/passwd', '/opt/project')).toBe(false);
  });

  it('handles Windows-style paths', () => {
    expect(isInsideWorkspace('C:\\projects\\src\\file.ts', 'C:\\projects')).toBe(true);
  });
});

describe('shouldPauseWriteFile', () => {
  it('does not pause for files inside workspace', () => {
    expect(shouldPauseWriteFile('/opt/project/src/new.ts', '/opt/project')).toBe(false);
  });

  it('pauses for files outside workspace', () => {
    expect(shouldPauseWriteFile('/etc/config', '/opt/project')).toBe(true);
  });
});
