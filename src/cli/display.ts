/**
 * CLI Display — colored output formatting.
 */

import chalk from 'chalk';

export function printWelcome(): void {
  console.log('');
  console.log(chalk.bold.magenta('  ╔══════════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta('  ║') + chalk.bold.white('  🤖 OpenRouter Multi-Agent Orchestrator v1      ') + chalk.bold.magenta('║'));
  console.log(chalk.bold.magenta('  ║') + chalk.gray('     by Volynskiy Business                       ') + chalk.bold.magenta('║'));
  console.log(chalk.bold.magenta('  ╚══════════════════════════════════════════════════╝'));
  console.log('');
  console.log(chalk.gray('  Type /help for commands, or just ask a question.'));
  console.log(chalk.gray('  Type /exit to quit.'));
  console.log('');
}

export function printHelp(): void {
  const commands = [
    ['/ask <prompt>', 'Auto-route to best agent'],
    ['/plan <prompt>', 'Force Planner agent'],
    ['/code <prompt>', 'Force Fast/Heavy Coder'],
    ['/review <prompt>', 'Force Judge agent'],
    ['/landing <brief>', 'Frontend: landing page pipeline'],
    ['/dashboard <spec>', 'Frontend: dashboard pipeline'],
    ['/dry-run <prompt>', 'Show plan without executing'],
    ['/budget', 'Show budget status'],
    ['/budget mode <m>', 'Set: strict | balanced | max_quality'],
    ['/audit [n]', 'Show last n audit entries'],
    ['/models', 'Show agents and models'],
    ['/help', 'Show this help'],
    ['/exit', 'Exit'],
  ];

  console.log(chalk.bold('\n  Available Commands:\n'));
  for (const [cmd, desc] of commands) {
    console.log(`  ${chalk.cyan(cmd.padEnd(22))} ${chalk.gray(desc)}`);
  }
  console.log('');
}

export function printResponse(text: string): void {
  console.log('');
  console.log(text);
  console.log('');
}

export function printError(message: string): void {
  console.log('');
  console.log(chalk.red(`  ❌ ${message}`));
  console.log('');
}

export function printInfo(message: string): void {
  console.log(chalk.gray(`  ℹ️  ${message}`));
}

export function getPromptString(): string {
  return chalk.yellow('❯ ');
}
