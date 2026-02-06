/**
 * AI Agent 007 - Main Entry Point
 * 
 * Coordinates the AI agent's workflow for autonomous code generation
 */

import 'dotenv/config';
import { Orchestrator } from './agent/orchestrator/index.js';
import { setupLogger } from './utils/logger.js';

const logger = setupLogger();

async function main() {
  logger.info('🤖 AI Agent 007 starting...');
  
  try {
    const orchestrator = new Orchestrator({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      temperature: parseFloat(process.env.TEMPERATURE || '0.7'),
      maxIterations: parseInt(process.env.MAX_ITERATIONS || '10'),
    });

    // Example: Generate a simple web application
    const result = await orchestrator.execute({
      type: 'webapp',
      description: 'Create a simple todo list application with React',
      requirements: [
        'User can add todos',
        'User can mark todos as complete',
        'User can delete todos',
        'Data persists in localStorage',
      ],
    });

    logger.info('✅ Agent completed successfully');
    logger.info('Generated files:', result.files);
    
  } catch (error) {
    logger.error('❌ Agent failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default main;
