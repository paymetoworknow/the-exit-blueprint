/**
 * Orchestrator Module
 * 
 * Coordinates all agent modules to complete coding tasks
 */

import { Planner } from '../planner/index.js';
import { Coder } from '../coder/index.js';
import { Executor } from '../executor/index.js';
import { Reviewer } from '../reviewer/index.js';

export class Orchestrator {
  constructor(config = {}) {
    this.config = config;
    this.planner = new Planner(config);
    this.coder = new Coder(config);
    this.executor = new Executor(config);
    this.reviewer = new Reviewer(config);
  }

  /**
   * Execute the full agent workflow
   * @param {Object} request - User request with type and requirements
   * @returns {Object} Result with generated files and metadata
   */
  async execute(request) {
    console.log('📋 Phase 1: Planning...');
    const plan = await this.planner.createPlan(request);

    console.log('💻 Phase 2: Coding...');
    const code = await this.coder.generateCode(plan);

    console.log('⚙️  Phase 3: Executing...');
    const executionResult = await this.executor.run(code);

    console.log('🔍 Phase 4: Reviewing...');
    const review = await this.reviewer.review(code, executionResult);

    // Iterate if needed
    if (review.needsImprovement && this.config.maxIterations > 0) {
      console.log('🔄 Iterating based on feedback...');
      return this.iterate(request, plan, code, review);
    }

    return {
      success: true,
      plan,
      files: code.files,
      executionResult,
      review,
    };
  }

  /**
   * Iterate on the code based on review feedback
   */
  async iterate(request, plan, code, review) {
    // Implement iteration logic here
    console.log('Iteration logic to be implemented');
    return { success: true, files: code.files };
  }
}
