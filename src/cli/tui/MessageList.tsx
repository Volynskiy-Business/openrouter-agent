/**
 * MessageList — Static append-only chat history.
 *
 * Uses Ink's <Static> so rendered messages are never re-rendered.
 * Preserves native terminal scrollback.
 */

import React from 'react';
import { Static, Box, Text } from 'ink';

export interface ChatMessage {
  id: string;
  timestamp: string;
  type: 'user' | 'agent' | 'system' | 'error';
  content: string;
  agentEmoji?: string;
  agentName?: string;
  model?: string;
}

interface MessageListProps {
  messages: ChatMessage[];
}

function renderMessage(msg: ChatMessage) {
  const time = msg.timestamp;

  switch (msg.type) {
    case 'user':
      return (
        <Box key={msg.id} flexDirection="column" marginBottom={1}>
          <Text>
            <Text color="gray">[{time}]</Text>{' '}
            <Text bold color="cyan">👤 User:</Text>{' '}
            <Text color="white">{msg.content}</Text>
          </Text>
        </Box>
      );

    case 'agent':
      return (
        <Box key={msg.id} flexDirection="column" marginBottom={1}>
          <Text>
            <Text color="gray">[{time}]</Text>{' '}
            <Text bold color="green">
              {msg.agentEmoji || '🤖'} {msg.agentName || 'Agent'}
            </Text>{' '}
            <Text color="gray">[{msg.model || 'unknown'}]</Text>
            <Text>:</Text>
          </Text>
          <Box marginLeft={2} flexDirection="column">
            <Text>{msg.content}</Text>
          </Box>
        </Box>
      );

    case 'system':
      return (
        <Box key={msg.id} marginBottom={1}>
          <Text>
            <Text color="gray">[{time}]</Text>{' '}
            <Text color="yellow">ℹ️  {msg.content}</Text>
          </Text>
        </Box>
      );

    case 'error':
      return (
        <Box key={msg.id} marginBottom={1}>
          <Text>
            <Text color="gray">[{time}]</Text>{' '}
            <Text color="red">❌ {msg.content}</Text>
          </Text>
        </Box>
      );

    default:
      return (
        <Box key={msg.id}>
          <Text>{msg.content}</Text>
        </Box>
      );
  }
}

export default function MessageList({ messages }: MessageListProps) {
  return (
    <Static items={messages}>
      {(msg) => renderMessage(msg)}
    </Static>
  );
}
