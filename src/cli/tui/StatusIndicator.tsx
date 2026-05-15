/**
 * StatusIndicator — shows spinner and current agent activity.
 */

import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

interface StatusIndicatorProps {
  isLoading: boolean;
  agentEmoji?: string;
  agentName?: string;
  status: string;
}

const STATUS_MESSAGES: Record<string, string> = {
  routing: 'Routing task to best agent...',
  executing: 'is thinking...',
  validating: 'Running validations...',
  escalating: 'Escalating to stronger model...',
};

export default function StatusIndicator({ isLoading, agentEmoji, agentName, status }: StatusIndicatorProps) {
  if (!isLoading) return null;

  const statusMsg = STATUS_MESSAGES[status] || 'Processing...';
  const agent = agentName ? `${agentEmoji || '🤖'} ${agentName}` : '';

  return (
    <Box marginY={1}>
      <Text color="cyan">
        <Spinner type="dots" />{' '}
      </Text>
      {agent ? (
        <Text>
          <Text bold color="green">{agent}</Text>{' '}
          <Text color="gray">{statusMsg}</Text>
        </Text>
      ) : (
        <Text color="gray">{statusMsg}</Text>
      )}
    </Box>
  );
}
