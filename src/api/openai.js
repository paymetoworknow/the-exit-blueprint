import OpenAI from 'openai';

// OpenAI Agent Configuration with Domain Key
const DOMAIN_KEY = 'domain_pk_6975eb4c348081939e1a0714ec2c67850c789740bb9d121d';

/**
 * Validate OpenAI configuration
 */
function validateOpenAIConfig() {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Add VITE_OPENAI_API_KEY to your .env.local file. See AI_SETUP.md for setup instructions.');
  }
  
  if (!apiKey.startsWith('sk-')) {
    throw new Error('Invalid OpenAI API key format. API keys should start with "sk-". Please check your VITE_OPENAI_API_KEY in .env.local');
  }
}

// Initialize OpenAI client (lazy initialization)
let openai = null;

function getOpenAIClient() {
  if (!openai) {
    validateOpenAIConfig();
    openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true // Required for client-side usage
    });
  }
  return openai;
}

/**
 * OpenAI Agent Integration
 * Invokes OpenAI with the configured domain key
 */
export async function invokeOpenAIAgent({ prompt, add_context_from_internet = false, response_json_schema = null }) {
  try {
    // Validate configuration before making API call
    const client = getOpenAIClient();
    const messages = [
      {
        role: 'system',
        content: `You are an AI assistant for Exit Blueprint (Domain: ${DOMAIN_KEY}), a business planning and exit strategy platform. Provide accurate, actionable advice for entrepreneurs planning business exits.`
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const requestParams = {
      model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    };

    // Add JSON response format if schema is provided
    if (response_json_schema) {
      requestParams.response_format = { type: 'json_object' };
      // Add instruction to return JSON
      messages[1].content = `${prompt}\n\nIMPORTANT: Return your response as valid JSON matching this structure: ${JSON.stringify(response_json_schema)}`;
    }

    const response = await client.chat.completions.create(requestParams);
    
    const content = response.choices[0].message.content;
    
    // Parse JSON if schema was requested
    if (response_json_schema) {
      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        throw new Error('AI returned invalid JSON. Please try again.');
      }
    }
    
    return content;
  } catch (error) {
    console.error('OpenAI Agent Error:', error);
    
    // Handle validation errors
    if (error.message && error.message.includes('not configured')) {
      throw error;
    }
    
    // Provide helpful error messages for API errors
    if (error.status === 401) {
      throw new Error('OpenAI API key is invalid. Please check VITE_OPENAI_API_KEY in .env.local. See AI_SETUP.md for help.');
    } else if (error.status === 429) {
      throw new Error('OpenAI rate limit exceeded. Please try again in a moment.');
    } else if (error.status === 500 || error.status === 503) {
      throw new Error('OpenAI service temporarily unavailable. Please try again.');
    } else if (error.code === 'ENOTFOUND' || error.message.includes('fetch')) {
      throw new Error('Network error connecting to OpenAI. Check your internet connection.');
    }
    
    // For other errors, provide a generic message
    throw new Error(`OpenAI error: ${error.message || 'Unknown error occurred'}`);
  }
}

export { DOMAIN_KEY };

/**
 * Generate image using DALL-E
 * @param {Object} options - Image generation options
 * @param {string} options.prompt - The image description
 * @returns {Promise<Object>} - Object with url property
 */
export async function generateOpenAIImage({ prompt }) {
  try {
    const client = getOpenAIClient();
    
    const response = await client.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
    });

    return {
      url: response.data[0].url
    };
  } catch (error) {
    console.error('OpenAI Image Generation Error:', error);
    
    if (error.status === 401) {
      throw new Error('OpenAI API key is invalid for image generation.');
    } else if (error.status === 429) {
      throw new Error('OpenAI rate limit exceeded for image generation.');
    } else if (error.status === 400) {
      throw new Error('Invalid image generation prompt. Please modify your request.');
    }
    
    throw new Error(`Image generation failed: ${error.message || 'Unknown error'}`);
  }
}

