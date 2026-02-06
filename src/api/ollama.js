/**
 * Ollama Self-Hosted AI Integration
 * Provides a free, self-hosted alternative to OpenAI
 * Requires Ollama to be running locally: https://ollama.ai
 */

const OLLAMA_URL = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = import.meta.env.VITE_OLLAMA_MODEL || 'llama3.2';

/**
 * Invoke Ollama for AI generation
 * @param {Object} params
 * @param {string} params.prompt - The prompt to send to the AI
 * @param {boolean} params.add_context_from_internet - Not used for Ollama
 * @param {Object} params.response_json_schema - If provided, will request JSON format
 * @returns {Promise<string|Object>} The AI response
 */
export async function invokeOllamaAgent({ prompt, add_context_from_internet = false, response_json_schema = null }) {
  try {
    const systemPrompt = 'You are an AI assistant for Exit Blueprint, a business planning and exit strategy platform. Provide accurate, actionable advice for entrepreneurs planning business exits.';
    
    let fullPrompt = `${systemPrompt}\n\n${prompt}`;
    
    // Add JSON instruction if schema is provided
    if (response_json_schema) {
      fullPrompt += `\n\nIMPORTANT: Return your response as valid JSON matching this structure: ${JSON.stringify(response_json_schema)}. Return ONLY the JSON, no additional text.`;
    }

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: fullPrompt,
        stream: false,
        format: response_json_schema ? 'json' : undefined,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.response;

    // Parse JSON if schema was requested
    if (response_json_schema) {
      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        console.error('Raw response:', content);
        throw new Error('AI returned invalid JSON. Please try again.');
      }
    }

    return content;
  } catch (error) {
    console.error('Ollama Agent Error:', error);

    // Provide helpful error messages
    if (error instanceof TypeError || error.message.includes('Failed to fetch')) {
      throw new Error(
        'Cannot connect to Ollama. Please ensure Ollama is installed and running. ' +
        'Install from: https://ollama.ai and run: ollama run ' + OLLAMA_MODEL
      );
    }

    throw error;
  }
}

/**
 * Check if Ollama is available
 * @returns {Promise<boolean>}
 */
export async function checkOllamaAvailability() {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      method: 'GET',
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get list of available Ollama models
 * @returns {Promise<Array>}
 */
export async function getOllamaModels() {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    return data.models || [];
  } catch {
    return [];
  }
}
