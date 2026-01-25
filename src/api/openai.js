import OpenAI from 'openai';

// OpenAI Agent Configuration with Domain Key
const DOMAIN_KEY = 'domain_pk_6975eb4c348081939e1a0714ec2c67850c789740bb9d121d';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Required for client-side usage
});

/**
 * OpenAI Agent Integration
 * Invokes OpenAI with the configured domain key
 */
export async function invokeOpenAIAgent({ prompt, add_context_from_internet = false, response_json_schema = null }) {
  try {
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

    const response = await openai.chat.completions.create(requestParams);
    
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
    
    // Provide helpful error messages
    if (error.status === 401) {
      throw new Error('OpenAI API key is invalid. Please check VITE_OPENAI_API_KEY in your environment variables.');
    } else if (error.status === 429) {
      throw new Error('OpenAI rate limit exceeded. Please try again in a moment.');
    } else if (error.status === 500) {
      throw new Error('OpenAI service error. Please try again.');
    }
    
    throw error;
  }
}

export { DOMAIN_KEY };
