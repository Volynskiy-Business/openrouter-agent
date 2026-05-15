#!/usr/bin/env node
/**
 * CLI Entry Point — dual mode:
 *   Default: Ink TUI (React-based interactive CLI)
 *   --plain: Fallback readline-based plain CLI
 *
 * Usage:
 *   npm start          # Ink TUI (default)
 *   npm run start:plain  # Plain readline fallback
 */

import { config as dotenvConfig } from 'dotenv';

// Load .env before anything else
dotenvConfig();

import { Orchestrator } from '../core/orchestrator.js';
import type { TaskType, AgentRole } from '../types.js';

// Resolve workspace directory
const workspaceDir = process.env.WORKSPACE_DIR || process.cwd();

// Create orchestrator
const orchestrator = new Orchestrator({ workspaceDir });

// ─── Mode Selection ─────────────────────────────────────────────────

const isPlainMode = process.argv.includes('--plain') || process.env.CLI_RENDERER === 'plain';

if (isPlainMode) {
  // ─── Plain Mode (readline fallback) ──────────────────────────────
  const { createInterface } = await import('readline');
  const { printWelcome, printHelp, printResponse, printError, getPromptString } = await import('./display.js');
  const { parseCommand } = await import('./commands.js');

  const COMMAND_TASK_MAP: Partial<Record<string, { taskType?: TaskType; agentRole?: AgentRole; dryRun?: boolean }>> = {
    plan: { taskType: 'planning', agentRole: 'planner' },
    code: { taskType: 'coding' },
    review: { taskType: 'review', agentRole: 'judge' },
    landing: { taskType: 'landing_page' },
    dashboard: { taskType: 'frontend_dashboard' },
    'dry-run': { dryRun: true },
  };

  async function handleInput(input: string): Promise<boolean> {
    const { command, args } = parseCommand(input);

    switch (command) {
      case 'exit':
        return false;

      case 'help':
        if (args.startsWith('Unknown')) printError(args);
        printHelp();
        return true;

      case 'budget':
        printResponse(orchestrator.handleBudgetCommand(args));
        return true;

      case 'audit':
        printResponse(orchestrator.handleAuditCommand(args));
        return true;

      case 'models':
        printResponse(orchestrator.handleModelsCommand());
        return true;

      case 'ask':
      case 'plan':
      case 'code':
      case 'review':
      case 'landing':
      case 'dashboard':
      case 'dry-run': {
        if (!args && command !== 'dry-run') {
          printError(`Usage: /${command} <prompt>`);
          return true;
        }

        const mapping = COMMAND_TASK_MAP[command] || {};
        try {
          const response = await orchestrator.processTask(args || input, {
            explicitTaskType: mapping.taskType,
            explicitAgent: mapping.agentRole,
            dryRun: mapping.dryRun,
          });
          printResponse(response);
        } catch (err) {
          printError((err as Error).message);
        }
        return true;
      }

      default:
        printHelp();
        return true;
    }
  }

  printWelcome();

  if (!process.env.OPENROUTER_API_KEY) {
    printError('OPENROUTER_API_KEY is not set. Create a .env file or set the environment variable.');
    process.exit(1);
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: getPromptString(),
  });

  rl.prompt();

  rl.on('line', async (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) {
      rl.prompt();
      return;
    }

    const shouldContinue = await handleInput(trimmed);
    if (!shouldContinue) {
      console.log('\n  👋 Goodbye!\n');
      rl.close();
      process.exit(0);
    }

    rl.prompt();
  });

  rl.on('close', () => {
    process.exit(0);
  });

} else {
  // ─── Ink TUI Mode (default) ──────────────────────────────────────
  const React = await import('react');
  const { render } = await import('ink');
  const { default: App } = await import('./tui/App.js');

  if (!process.env.OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY is not set. Create a .env file or set the environment variable.');
    console.error('   Get your key at: https://openrouter.ai/settings/keys');
    process.exit(1);
  }

  render(React.createElement(App, { orchestrator }));
}
