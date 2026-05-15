/**
 * PromptInput — user input with ink-text-input.
 */

import React from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  isDisabled: boolean;
}

export default function PromptInput({ value, onChange, onSubmit, isDisabled }: PromptInputProps) {
  if (isDisabled) return null;

  return (
    <Box>
      <Text bold color="yellow">❯ </Text>
      <TextInput
        value={value}
        onChange={onChange}
        onSubmit={onSubmit}
      />
    </Box>
  );
}
