/**
 * CLI Command Parser — parse /commands from user input.
 */

import type { ParsedCommand, CliCommand } from '../types.js';

const COMMAND_MAP: Record<string, CliCommand> = {
  '/ask': 'ask',
  '/plan': 'plan',
  '/code': 'code',
  '/review': 'review',
  '/landing': 'landing',
  '/dashboard': 'dashboard',
  '/dry-run': 'dry-run',
  '/dryrun': 'dry-run',
  '/budget': 'budget',
  '/audit': 'audit',
  '/models': 'models',
  '/help': 'help',
  '/exit': 'exit',
  '/quit': 'exit',
  '/q': 'exit',
};

export function parseCommand(input: string): ParsedCommand {
  const trimmed = input.trim();

  if (!trimmed.startsWith('/')) {
    // Treat as implicit /ask
    return { command: 'ask', args: trimmed };
  }

  // Extract command and args
  const spaceIdx = trimmed.indexOf(' ');
  const cmdPart = spaceIdx > -1 ? trimmed.slice(0, spaceIdx).toLowerCase() : trimmed.toLowerCase();
  const args = spaceIdx > -1 ? trimmed.slice(spaceIdx + 1).trim() : '';

  const command = COMMAND_MAP[cmdPart];
  if (!command) {
    return { command: 'help', args: `Unknown command: ${cmdPart}` };
  }

  return { command, args };
}
