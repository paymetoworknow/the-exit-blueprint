# AI Integration TODO

## Overview

The Base44 LLM integration (`base44.integrations.Core.InvokeLLM`) has been replaced with a placeholder in `src/api/entities.js`. This document outlines how to implement a self-hosted AI agent to complete the migration.

## Current Status

✅ **Completed:**
- All Base44 SDK references have been removed
- Supabase client is fully integrated
- Entity operations work with Supabase
- Authentication migrated to Supabase Auth
- Build and lint pass successfully

⚠️ **Pending:**
- Implement self-hosted AI agent integration
- Connect AI agent to the `integrations.Core.InvokeLLM` function

## Where AI is Used

The application uses AI in several features:

1. **Market Analysis (Stage1Oracle.jsx)**
   - Generates TAM/SAM/SOM market sizing
   - Creates SWOT analysis
   - Generates lean canvas model
   - Analyzes competitors

2. **Risk Analysis (RiskAnalysis.jsx)**
   - Analyzes business risks
   - Provides risk mitigation strategies

3. **Business Plan Generator (BusinessPlanGenerator.jsx)**
   - Generates comprehensive business plans

4. **Decision Assistant (DecisionAssistant.jsx)**
   - Provides AI-powered decision recommendations

5. **Other features** that use AI-powered generation

## Implementation Options

### Option 1: OpenAI API (Recommended for Quick Setup)

```javascript
// In src/api/entities.js
export const integrations = {
  Core: {
    async InvokeLLM({ prompt, add_context_from_internet = false, response_json_schema = null }) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          response_format: response_json_schema ? { type: 'json_object' } : undefined,
        }),
      });
      
      const data = await response.json();
      const content = data.choices[0].message.content;
      
      return response_json_schema ? JSON.parse(content) : content;
    }
  }
};
```

**Required Environment Variable:**
- `VITE_OPENAI_API_KEY` - Your OpenAI API key

### Option 2: Anthropic Claude API

```javascript
export const integrations = {
  Core: {
    async InvokeLLM({ prompt, add_context_from_internet = false, response_json_schema = null }) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      
      const data = await response.json();
      const content = data.content[0].text;
      
      return response_json_schema ? JSON.parse(content) : content;
    }
  }
};
```

**Required Environment Variable:**
- `VITE_ANTHROPIC_API_KEY` - Your Anthropic API key

### Option 3: Self-Hosted LLM (Local)

For truly self-hosted solution, you could use:
- **Ollama** - Run LLMs locally
- **LM Studio** - Local LLM server
- **vLLM** - High-performance LLM serving

Example with Ollama:

```javascript
export const integrations = {
  Core: {
    async InvokeLLM({ prompt, add_context_from_internet = false, response_json_schema = null }) {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama2',
          prompt: prompt,
          stream: false,
          format: response_json_schema ? 'json' : undefined,
        }),
      });
      
      const data = await response.json();
      const content = data.response;
      
      return response_json_schema ? JSON.parse(content) : content;
    }
  }
};
```

### Option 4: Supabase Edge Functions + AI

You could create a Supabase Edge Function that calls an AI service:

```typescript
// supabase/functions/invoke-llm/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { prompt, response_json_schema } = await req.json()
  
  // Call your AI service here (OpenAI, Anthropic, etc.)
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  
  const data = await response.json()
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

Then call it from the client:

```javascript
export const integrations = {
  Core: {
    async InvokeLLM({ prompt, add_context_from_internet = false, response_json_schema = null }) {
      const { data, error } = await supabase.functions.invoke('invoke-llm', {
        body: { prompt, response_json_schema }
      });
      
      if (error) throw error;
      return data;
    }
  }
};
```

## Next Steps

1. Choose your AI integration approach
2. Update `src/api/entities.js` with the implementation
3. Add required environment variables to `.env.local`
4. Test AI features in the application
5. Consider implementing rate limiting and error handling
6. Add cost monitoring if using paid APIs

## Testing AI Integration

After implementation, test these features:
- Generate market analysis in Stage 1
- Create risk assessments
- Generate business plans
- Use decision assistant

## Notes

- The current placeholder throws an error to clearly indicate AI is not configured
- All other functionality (CRUD operations, auth, etc.) works without AI
- The `add_context_from_internet` parameter may require additional implementation for web search/scraping
- Consider caching AI responses in Supabase to reduce API costs
