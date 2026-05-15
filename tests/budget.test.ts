/**
 * Budget Tests — verify budget modes, spend limits, model eligibility.
 */

import { describe, it, expect } from 'vitest';
import { getStopConfig, canUsePaidModel } from '../src/config/budget.js';

describe('getStopConfig', () => {
  it('strict mode: caps steps and blocks cost', () => {
    const config = getStopConfig('strict', 10);
    expect(config.maxSteps).toBe(10);
    expect(config.maxCostUsd).toBe(0);
  });

  it('strict mode: respects agent step ceiling when lower than mode limit', () => {
    const config = getStopConfig('strict', 5);
    expect(config.maxSteps).toBe(5);
  });

  it('balanced mode: allows cost up to $0.50', () => {
    const config = getStopConfig('balanced', 10);
    expect(config.maxSteps).toBe(10);
    expect(config.maxCostUsd).toBe(0.5);
  });

  it('max_quality mode: allows up to 20 steps and $2.00', () => {
    const config = getStopConfig('max_quality', 25);
    expect(config.maxSteps).toBe(20); // Capped by mode
    expect(config.maxCostUsd).toBe(2.0);
  });
});

describe('canUsePaidModel', () => {
  it('strict mode: always returns false', () => {
    expect(canUsePaidModel('strict', 'low')).toBe(false);
    expect(canUsePaidModel('strict', 'high')).toBe(false);
  });

  it('balanced mode: only for high-risk', () => {
    expect(canUsePaidModel('balanced', 'low')).toBe(false);
    expect(canUsePaidModel('balanced', 'medium')).toBe(false);
    expect(canUsePaidModel('balanced', 'high')).toBe(true);
  });

  it('max_quality mode: always allowed', () => {
    expect(canUsePaidModel('max_quality', 'low')).toBe(true);
    expect(canUsePaidModel('max_quality', 'high')).toBe(true);
  });
});
