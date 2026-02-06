/**
 * AI Client Utility
 * 
 * Handles communication with AI providers (OpenAI, etc.)
 */

import OpenAI from 'openai';

class AIClient {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.model = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
  }

  /**
   * Send a prompt to the AI model
   * @param {string} prompt - The prompt to send
   * @param {Object} options - Additional options
   * @returns {string} AI response
   */
  async prompt(prompt, options = {}) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: options.model || this.model,
        messages: [
          {
            role: 'system',
            content: options.systemPrompt || 'You are an expert software developer.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 4000,
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('AI API Error:', error);
      throw error;
    }
  }

  /**
   * Generate code with AI
   */
  async generateCode(spec) {
    const prompt = `Generate production-ready code for the following specification:\n\n${JSON.stringify(spec, null, 2)}`;
    return this.prompt(prompt, {
      systemPrompt: 'You are an expert software developer. Generate clean, well-documented, production-ready code.',
    });
  }

  /**
   * Review code with AI
   */
  async reviewCode(code) {
    const prompt = `Review the following code and provide feedback on quality, security, and best practices:\n\n${code}`;
    return this.prompt(prompt, {
      systemPrompt: 'You are an expert code reviewer. Provide constructive feedback on code quality, security, and best practices.',
    });
  }
}

let clientInstance = null;

export function getAIClient() {
  if (!clientInstance) {
    clientInstance = new AIClient();
  }
  return clientInstance;
}
