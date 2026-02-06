/**
 * Example: Generate a Simple Todo App
 * 
 * This example demonstrates how to use AI Agent 007 to generate
 * a complete todo list application.
 */

import { Orchestrator } from '../src/agent/orchestrator/index.js';
import { setupLogger } from '../src/utils/logger.js';

const logger = setupLogger();

async function generateTodoApp() {
  logger.info('🚀 Starting Todo App Generation Example');

  const orchestrator = new Orchestrator({
    model: 'gpt-4-turbo-preview',
    temperature: 0.7,
    maxIterations: 5,
  });

  const request = {
    type: 'webapp',
    description: 'A simple, elegant todo list application',
    requirements: [
      'Add new todos with a title',
      'Mark todos as complete/incomplete',
      'Delete todos',
      'Filter todos by status (all, active, completed)',
      'Show count of active todos',
      'Persist todos in localStorage',
      'Clean, modern UI design',
      'Mobile responsive',
    ],
    preferences: {
      framework: 'React',
      styling: 'CSS',
      stateManagement: 'useState hooks',
    },
  };

  try {
    logger.info('📋 Generating todo app with requirements:', request.requirements);

    const result = await orchestrator.execute(request);

    if (result.success) {
      logger.success('✅ Todo app generated successfully!');
      logger.info('📁 Generated files:');
      Object.keys(result.files).forEach(file => {
        logger.info(`   - ${file}`);
      });

      logger.info('📊 Quality Score:', result.review.score);

      if (result.review.issues.length > 0) {
        logger.warn('⚠️  Issues found:', result.review.issues.length);
        result.review.issues.forEach(issue => {
          logger.warn(`   - ${issue.type}: ${issue.message}`);
        });
      }
    } else {
      logger.error('❌ Generation failed');
    }

    return result;
  } catch (error) {
    logger.error('❌ Error:', error);
    throw error;
  }
}

// Run the example
generateTodoApp()
  .then(() => {
    console.log('\n✨ Example completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Example failed:', error);
    process.exit(1);
  });
