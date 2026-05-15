/**
 * Approval Gate — HITL approval for dangerous tool calls.
 */

import { createInterface } from 'readline';

export async function requestHumanApproval(
  toolName: string,
  description: string,
  args: Record<string, unknown>,
): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stderr });

  console.error('');
  console.error(`⚠️  APPROVAL REQUIRED: ${toolName}`);
  console.error(`   ${description}`);
  if (Object.keys(args).length > 0) {
    console.error(`   Args: ${JSON.stringify(args, null, 2)}`);
  }

  return new Promise<boolean>((resolve) => {
    rl.question('   Approve? (y/N): ', (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
}
