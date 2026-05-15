/**
 * Action Ledger — structured JSONL audit log.
 */

import { appendFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import type { AuditEntry } from '../types.js';

const LOG_DIR = join(process.cwd(), 'logs');
const LOG_FILE = join(LOG_DIR, 'audit.jsonl');

let entryCounter = 0;

function ensureLogDir(): void {
  if (!existsSync(LOG_DIR)) {
    mkdirSync(LOG_DIR, { recursive: true });
  }
}

export function generateEntryId(): string {
  entryCounter++;
  return `evt_${Date.now()}_${entryCounter.toString().padStart(4, '0')}`;
}

export function writeAuditEntry(entry: AuditEntry): void {
  ensureLogDir();
  const line = JSON.stringify(entry) + '\n';
  appendFileSync(LOG_FILE, line, 'utf-8');
}

export function createAuditEntry(partial: Partial<AuditEntry> & Pick<AuditEntry, 'action' | 'agentRole' | 'model' | 'taskType' | 'riskLevel' | 'budgetMode'>): AuditEntry {
  return {
    id: generateEntryId(),
    timestamp: new Date().toISOString(),
    routingReason: '',
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
    durationMs: 0,
    toolCalls: [],
    approvalRequired: false,
    approvalGranted: null,
    success: true,
    escalatedFrom: null,
    ...partial,
  };
}
