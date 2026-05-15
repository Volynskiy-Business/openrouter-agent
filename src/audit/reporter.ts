/**
 * Audit Reporter — query and format audit log entries for /audit command.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { AuditEntry } from '../types.js';

const LOG_FILE = join(process.cwd(), 'logs', 'audit.jsonl');

export function readAuditEntries(limit: number = 10): AuditEntry[] {
  if (!existsSync(LOG_FILE)) return [];

  const content = readFileSync(LOG_FILE, 'utf-8').trim();
  if (!content) return [];

  const lines = content.split('\n');
  const entries: AuditEntry[] = [];

  // Read from end (most recent first)
  const start = Math.max(0, lines.length - limit);
  for (let i = lines.length - 1; i >= start; i--) {
    try {
      entries.push(JSON.parse(lines[i]) as AuditEntry);
    } catch {
      // Skip malformed lines
    }
  }

  return entries;
}

export function formatAuditEntry(entry: AuditEntry): string {
  const cost = entry.costUsd > 0 ? `$${entry.costUsd.toFixed(4)}` : 'free';
  const tokens = `${entry.inputTokens}→${entry.outputTokens}`;
  const tools = entry.toolCalls.length > 0 ? entry.toolCalls.join(', ') : 'none';
  const status = entry.success ? '✅' : '❌';
  const escalation = entry.escalatedFrom ? ` (escalated from ${entry.escalatedFrom})` : '';

  return [
    `${status} ${entry.id} | ${entry.timestamp}`,
    `   Agent: ${entry.agentRole} | Model: ${entry.model}`,
    `   Task: ${entry.taskType} | Risk: ${entry.riskLevel} | Budget: ${entry.budgetMode}`,
    `   Tokens: ${tokens} | Cost: ${cost} | Duration: ${entry.durationMs}ms`,
    `   Tools: ${tools}${escalation}`,
    entry.routingReason ? `   Reason: ${entry.routingReason}` : '',
    entry.error ? `   Error: ${entry.error}` : '',
  ].filter(Boolean).join('\n');
}

export function formatAuditReport(entries: AuditEntry[]): string {
  if (entries.length === 0) return 'No audit entries found.';
  return entries.map(formatAuditEntry).join('\n\n');
}
