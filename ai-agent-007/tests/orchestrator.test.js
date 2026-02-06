/**
 * Test Suite for Orchestrator
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Orchestrator } from '../src/agent/orchestrator/index.js';

describe('Orchestrator', () => {
  it('should create an orchestrator instance', () => {
    const orchestrator = new Orchestrator();
    assert.ok(orchestrator);
    assert.ok(orchestrator.planner);
    assert.ok(orchestrator.coder);
    assert.ok(orchestrator.executor);
    assert.ok(orchestrator.reviewer);
  });

  it('should accept configuration', () => {
    const config = {
      model: 'gpt-4',
      temperature: 0.5,
      maxIterations: 5,
    };
    const orchestrator = new Orchestrator(config);
    assert.deepStrictEqual(orchestrator.config, config);
  });

  // More tests to be added as implementation progresses
});
