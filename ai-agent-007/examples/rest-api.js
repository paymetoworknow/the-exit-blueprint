/**
 * Example: Generate a REST API
 * 
 * Demonstrates generating a Node.js REST API with Express
 */

import { Orchestrator } from '../src/agent/orchestrator/index.js';
import { setupLogger } from '../src/utils/logger.js';

const logger = setupLogger();

async function generateAPI() {
  logger.info('🚀 Starting API Generation Example');

  const orchestrator = new Orchestrator({
    model: 'gpt-4-turbo-preview',
    temperature: 0.7,
  });

  const request = {
    type: 'api',
    description: 'RESTful API for a blog platform',
    requirements: [
      'Create, read, update, delete posts',
      'User authentication with JWT',
      'Post categories and tags',
      'Search posts by title or content',
      'Pagination for post listings',
      'Input validation',
      'Error handling middleware',
      'API documentation',
    ],
    preferences: {
      framework: 'Express',
      database: 'MongoDB',
      authentication: 'JWT',
    },
  };

  try {
    const result = await orchestrator.execute(request);
    
    if (result.success) {
      logger.success('✅ API generated successfully!');
      logger.info('Generated endpoints:');
      // Display generated API endpoints
    }

    return result;
  } catch (error) {
    logger.error('❌ Error:', error);
    throw error;
  }
}

generateAPI();
