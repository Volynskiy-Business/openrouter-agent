/**
 * Router Tests — verify task classification and routing logic.
 */

import { describe, it, expect } from 'vitest';
import { classifyTask, selectRoute } from '../src/config/routing.js';

describe('classifyTask', () => {
  it('classifies coding tasks', () => {
    const result = classifyTask('Write a function to parse JSON');
    expect(result.taskType).toBe('coding');
  });

  it('classifies planning tasks', () => {
    const result = classifyTask('Plan the architecture for auth module');
    expect(result.taskType).toBe('planning');
  });

  it('classifies review tasks', () => {
    const result = classifyTask('Review this code for security issues');
    expect(result.taskType).toBe('review');
  });

  it('classifies landing page tasks', () => {
    const result = classifyTask('Build a landing page for our SaaS');
    expect(result.taskType).toBe('landing_page');
  });

  it('classifies dashboard tasks', () => {
    const result = classifyTask('Create an admin dashboard with charts');
    expect(result.taskType).toBe('frontend_dashboard');
  });

  it('classifies high-risk coding', () => {
    const result = classifyTask('Refactor the authentication module completely');
    expect(result.taskType).toBe('coding');
    expect(result.riskLevel).toBe('high');
  });

  it('defaults to general for unknown prompts', () => {
    const result = classifyTask('Tell me a joke');
    expect(result.taskType).toBe('general');
  });

  it('respects explicit task type override', () => {
    const result = classifyTask('anything', 'review');
    expect(result.taskType).toBe('review');
  });
});

describe('selectRoute', () => {
  it('routes landing_page to frontend_builder', () => {
    expect(selectRoute('landing_page', 'medium')).toBe('frontend_builder');
  });

  it('routes frontend_dashboard to frontend_builder', () => {
    expect(selectRoute('frontend_dashboard', 'medium')).toBe('frontend_builder');
  });

  it('routes planning to planner', () => {
    expect(selectRoute('planning', 'low')).toBe('planner');
  });

  it('routes review to judge', () => {
    expect(selectRoute('review', 'low')).toBe('judge');
  });

  it('routes high-risk coding to heavy_coder', () => {
    expect(selectRoute('coding', 'high')).toBe('heavy_coder');
  });

  it('routes large context coding to heavy_coder', () => {
    expect(selectRoute('coding', 'low', 50_000)).toBe('heavy_coder');
  });

  it('routes normal coding to fast_coder', () => {
    expect(selectRoute('coding', 'low')).toBe('fast_coder');
  });

  it('routes general to fast_coder', () => {
    expect(selectRoute('general', 'low')).toBe('fast_coder');
  });
});
