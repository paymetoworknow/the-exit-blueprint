/**
 * Test Suite for Planner
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Planner } from '../src/agent/planner/index.js';

describe('Planner', () => {
  it('should create a planner instance', () => {
    const planner = new Planner();
    assert.ok(planner);
  });

  it('should create a plan from requirements', async () => {
    const planner = new Planner();
    const request = {
      type: 'webapp',
      description: 'Test app',
      requirements: ['Feature 1', 'Feature 2'],
    };

    const plan = await planner.createPlan(request);
    
    assert.ok(plan);
    assert.strictEqual(plan.projectType, 'webapp');
    assert.ok(plan.files);
    assert.ok(Array.isArray(plan.files));
  });
});
