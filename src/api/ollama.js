/**
 * Ollama Agent Integration
 * Self-hosted LLM integration for local AI inference
 */

const DEFAULT_OLLAMA_URL = 'http://localhost:11434';
const DEFAULT_MODEL = 'llama3.2';
const REQUEST_TIMEOUT = 60000; // 60 seconds

/**
 * Invoke Ollama agent with error handling and timeout
 * @param {Object} options - Invocation options
 * @param {string} options.prompt - The prompt to send to the LLM
 * @param {Object} options.response_json_schema - Optional JSON schema for structured output
 * @returns {Promise<string|Object>} - Response text or parsed JSON
 */
export async function invokeOllamaAgent({ prompt, response_json_schema = null }) {
  const ollamaUrl = import.meta.env.VITE_OLLAMA_URL || DEFAULT_OLLAMA_URL;
  const model = import.meta.env.VITE_OLLAMA_MODEL || DEFAULT_MODEL;
  
  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const requestBody = {
      model,
      prompt,
      stream: false,
    };

    // Add JSON format if schema is provided
    if (response_json_schema) {
      requestBody.format = 'json';
      // Add instruction to return JSON matching the schema
      requestBody.prompt = `${prompt}\n\nIMPORTANT: Return your response as valid JSON matching this structure: ${JSON.stringify(response_json_schema)}`;
    }

    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Check for HTTP errors
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.response;

    if (!content) {
      throw new Error('Ollama returned empty response');
    }

    // Parse JSON if schema was requested
    if (response_json_schema) {
      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse JSON response from Ollama:', parseError);
        console.error('Raw response:', content);
        throw new Error('Ollama returned invalid JSON. Please try again or check model compatibility.');
      }
    }

    return content;
  } catch (error) {
    console.error('Ollama Agent Error:', error);

    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(`Ollama unreachable at ${ollamaUrl}. Ensure Ollama is running locally. See AI_SETUP.md for installation instructions.`);
    }

    // Handle timeout
    if (error.name === 'AbortError') {
      throw new Error('Ollama request timed out. The model may be processing a complex prompt or the server is slow.');
    }

    // Handle CORS errors
    if (error.message.includes('CORS')) {
      throw new Error('CORS error connecting to Ollama. Make sure Ollama is configured to allow requests from this origin.');
    }

    // Re-throw with original message if already formatted
    throw error;
  }
}

/**
 * Check if Ollama is available and running
 * @returns {Promise<boolean>} - True if Ollama is available
 */
export async function checkOllamaAvailability() {
  const ollamaUrl = import.meta.env.VITE_OLLAMA_URL || DEFAULT_OLLAMA_URL;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${ollamaUrl}/api/version`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Generate image using Ollama (placeholder - Ollama doesn't support image generation natively)
 * This would require integration with a separate image generation service
 */
export async function generateOllamaImage({ prompt }) {
  throw new Error('Image generation is not supported with Ollama. Please use OpenAI with DALL-E or another image generation service.');
}
