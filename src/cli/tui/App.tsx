/**
 * App — Root TUI component. Manages state machine for the entire CLI.
 *
 * Uses Ink's <Static> for append-only chat history and dynamic footer
 * for spinner + input. This preserves native terminal scrollback.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import Header from './Header.js';
import MessageList, { type ChatMessage } from './MessageList.js';
import StatusIndicator from './StatusIndicator.js';
import PromptInput from './PromptInput.js';
import { parseCommand } from '../commands.js';
import { Orchestrator } from '../../core/orchestrator.js';
import { getBudgetState } from '../../policy/budget-enforcer.js';
import type { TaskType, AgentRole, BudgetMode } from '../../types.js';

// ─── Task type mapping ──────────────────────────────────────────────

const COMMAND_TASK_MAP: Partial<Record<string, { taskType?: TaskType; agentRole?: AgentRole; dryRun?: boolean }>> = {
  plan: { taskType: 'planning', agentRole: 'planner' },
  code: { taskType: 'coding' },
  review: { taskType: 'review', agentRole: 'judge' },
  landing: { taskType: 'landing_page' },
  dashboard: { taskType: 'frontend_dashboard' },
  'dry-run': { dryRun: true },
};

// ─── Help text ──────────────────────────────────────────────────────

const HELP_TEXT = [
  '/ask <prompt>         Auto-route to best agent',
  '/plan <prompt>        Force Planner agent',
  '/code <prompt>        Force Fast/Heavy Coder',
  '/review <prompt>      Force Judge agent',
  '/landing <brief>      Frontend: landing page pipeline',
  '/dashboard <spec>     Frontend: dashboard pipeline',
  '/dry-run <prompt>     Show plan without executing',
  '/budget               Show budget status',
  '/budget mode <m>      Set: strict | balanced | max_quality',
  '/audit [n]            Show last n audit entries',
  '/models               Show agents and models',
  '/help                 Show this help',
  '/exit                 Exit',
].join('\n');

// ─── ID generator ───────────────────────────────────────────────────

let msgCounter = 0;
function nextId(): string {
  return `msg_${++msgCounter}`;
}

function timestamp(): string {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

// ─── Props ──────────────────────────────────────────────────────────

interface AppProps {
  orchestrator: Orchestrator;
}

// ─── Component ──────────────────────────────────────────────────────

export default function App({ orchestrator }: AppProps) {
  const { exit } = useApp();

  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('idle');
  const [activeAgent, setActiveAgent] = useState<{ emoji: string; name: string } | null>(null);
  const [budgetMode, setBudgetMode] = useState(getBudgetState().mode);
  const [todaySpend, setTodaySpend] = useState(getBudgetState().todaySpendUsd);

  // Listen to orchestrator events
  useEffect(() => {
    const onStatus = (s: string) => setStatus(s);
    const onAgentStart = (info: { emoji: string; displayName: string }) => {
      setActiveAgent({ emoji: info.emoji, name: info.displayName });
    };
    const onAgentDone = () => {
      setActiveAgent(null);
    };
    const onBudgetUpdate = (state: { mode: BudgetMode; todaySpendUsd: number }) => {
      setBudgetMode(state.mode);
      setTodaySpend(state.todaySpendUsd);
    };

    orchestrator.on('status', onStatus);
    orchestrator.on('agent:start', onAgentStart);
    orchestrator.on('agent:done', onAgentDone);
    orchestrator.on('budget:update', onBudgetUpdate);

    return () => {
      orchestrator.off('status', onStatus);
      orchestrator.off('agent:start', onAgentStart);
      orchestrator.off('agent:done', onAgentDone);
      orchestrator.off('budget:update', onBudgetUpdate);
    };
  }, [orchestrator]);

  // Add message helper
  const addMessage = useCallback((msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    setMessages((prev) => [...prev, { ...msg, id: nextId(), timestamp: timestamp() }]);
  }, []);

  // Handle input submission
  const handleSubmit = useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    setInputValue('');

    // Add user message
    addMessage({ type: 'user', content: trimmed });

    const { command, args } = parseCommand(trimmed);

    switch (command) {
      case 'exit':
        addMessage({ type: 'system', content: '👋 Goodbye!' });
        setTimeout(() => exit(), 100);
        return;

      case 'help':
        if (args.startsWith('Unknown')) {
          addMessage({ type: 'error', content: args });
        }
        addMessage({ type: 'system', content: HELP_TEXT });
        return;

      case 'budget':
        addMessage({ type: 'system', content: orchestrator.handleBudgetCommand(args) });
        return;

      case 'audit':
        addMessage({ type: 'system', content: orchestrator.handleAuditCommand(args) });
        return;

      case 'models':
        addMessage({ type: 'system', content: orchestrator.handleModelsCommand() });
        return;

      case 'ask':
      case 'plan':
      case 'code':
      case 'review':
      case 'landing':
      case 'dashboard':
      case 'dry-run': {
        if (!args && command !== 'dry-run') {
          addMessage({ type: 'error', content: `Usage: /${command} <prompt>` });
          return;
        }

        const mapping = COMMAND_TASK_MAP[command] || {};
        setIsLoading(true);

        try {
          const response = await orchestrator.processTask(args || trimmed, {
            explicitTaskType: mapping.taskType,
            explicitAgent: mapping.agentRole,
            dryRun: mapping.dryRun,
          });

          // Parse agent info from response header
          const headerMatch = response.match(/^(.+?) \[(.+?) \| (.+?)\]/);
          addMessage({
            type: 'agent',
            content: response,
            agentEmoji: headerMatch?.[1],
            agentName: headerMatch?.[2],
            model: headerMatch?.[3],
          });
        } catch (err) {
          addMessage({ type: 'error', content: (err as Error).message });
        }

        setIsLoading(false);
        return;
      }

      default:
        addMessage({ type: 'system', content: HELP_TEXT });
    }
  }, [orchestrator, addMessage, exit]);

  // Ctrl+C handler
  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      exit();
    }
  });

  return (
    <Box flexDirection="column">
      <Header
        budgetMode={budgetMode}
        todaySpend={todaySpend}
        status={status}
      />

      <MessageList messages={messages} />

      <StatusIndicator
        isLoading={isLoading}
        agentEmoji={activeAgent?.emoji}
        agentName={activeAgent?.name}
        status={status}
      />

      <Box marginTop={0}>
        <PromptInput
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSubmit}
          isDisabled={isLoading}
        />
      </Box>
    </Box>
  );
}
