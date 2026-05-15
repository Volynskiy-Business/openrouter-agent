/**
 * TUI Header — shows banner, budget mode, and agent status.
 */

import React from 'react';
import { Box, Text } from 'ink';

interface HeaderProps {
  budgetMode: string;
  todaySpend: number;
  status: string;
}

const STATUS_ICONS: Record<string, string> = {
  idle: '🟢 Idle',
  routing: '🔄 Routing',
  executing: '🟡 Executing',
  validating: '🔵 Validating',
  escalating: '🟠 Escalating',
};

export default function Header({ budgetMode, todaySpend, status }: HeaderProps) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box borderStyle="double" borderColor="magenta" paddingX={1} flexDirection="column">
        <Text bold color="white">
          🤖 OpenRouter Multi-Agent Orchestrator v1.1
        </Text>
        <Box>
          <Text color="yellow">💰 Budget: </Text>
          <Text bold color="cyan">{budgetMode}</Text>
          <Text color="gray"> (${todaySpend.toFixed(4)} today)</Text>
          <Text>   </Text>
          <Text color="yellow">⚡ Status: </Text>
          <Text>{STATUS_ICONS[status] || status}</Text>
        </Box>
      </Box>
    </Box>
  );
}
