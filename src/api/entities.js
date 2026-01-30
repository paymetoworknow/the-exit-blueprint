import { supabase } from './supabase';

/**
 * Helper functions to interact with Supabase tables
 * These functions provide a similar interface to the previous Base44 SDK
 */

const createEntity = (tableName) => ({
  async list(orderBy = '-created_date', limit = null) {
    let query = supabase.from(tableName).select('*');
    
    // Handle ordering
    if (orderBy) {
      const ascending = !orderBy.startsWith('-');
      const field = orderBy.replace('-', '');
      query = query.order(field, { ascending });
    }
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async filter(filterObj) {
    let query = supabase.from(tableName).select('*');
    
    // Apply filters
    Object.entries(filterObj).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async get(id) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(payload) {
    const { data, error } = await supabase
      .from(tableName)
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, payload) {
    const { data, error } = await supabase
      .from(tableName)
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  },
});

// Export entities that match the Base44 SDK structure
export const entities = {
  BusinessCore: createEntity('business_core'),
  Financials: createEntity('financials'),
  CRMLead: createEntity('crm_lead'),
  MarketAnalysis: createEntity('market_analysis'),
  RiskAssessment: createEntity('risk_assessment'),
  BusinessPlan: createEntity('business_plan'),
  DecisionLog: createEntity('decision_log'),
  Decision: createEntity('decision_log'), // Alias for DecisionLog
  PitchDeck: createEntity('pitch_deck'),
  Investor: createEntity('investor'),
  InvestorOutreach: createEntity('investor_outreach'),
  BrandAsset: createEntity('brand_asset'),
  BrandAssets: createEntity('brand_asset'), // Alias for BrandAsset
  BrandAudit: createEntity('brand_audit'),
  DataRoom: createEntity('data_room'),
  DueDiligence: createEntity('due_diligence'),
  Document: createEntity('document'),
  SupportTicket: createEntity('support_ticket'),
  ChatMessage: createEntity('chat_message'),
  SharedContent: createEntity('shared_content'),
  Feedback: createEntity('feedback'),
  SalesGoal: createEntity('sales_goal'),
};

// AI Integration with OpenAI Agent or Ollama
import { invokeOpenAIAgent, DOMAIN_KEY } from './openai';
import { invokeOllamaAgent } from './ollama';

// Determine which AI provider to use
const useOllama = import.meta.env.VITE_USE_OLLAMA === 'true';
const hasOpenAIKey = import.meta.env.VITE_OPENAI_API_KEY && 
  import.meta.env.VITE_OPENAI_API_KEY !== 'sk-your-openai-api-key-here';

export const integrations = {
  Core: {
    async InvokeLLM({ prompt, add_context_from_internet = false, response_json_schema = null }) {
      // Use Ollama if configured
      if (useOllama) {
        console.log('Using Ollama (self-hosted AI)');
        return await invokeOllamaAgent({
          prompt,
          add_context_from_internet,
          response_json_schema
        });
      }
      
      // Fall back to OpenAI if available
      if (hasOpenAIKey) {
        console.log('Using OpenAI');
        return await invokeOpenAIAgent({
          prompt,
          add_context_from_internet,
          response_json_schema
        });
      }
      
      // No AI provider configured
      throw new Error(
        'No AI provider configured. Please either:\n' +
        '1. Add VITE_OPENAI_API_KEY to .env.local for OpenAI (paid)\n' +
        '2. Set VITE_USE_OLLAMA=true and run Ollama locally (free)\n\n' +
        'For Ollama setup:\n' +
        '- Install from: https://ollama.ai\n' +
        '- Run: ollama pull llama3.2\n' +
        '- Set VITE_USE_OLLAMA=true in .env.local'
      );
    }
  }
};

// Export domain key for reference
export { DOMAIN_KEY };
