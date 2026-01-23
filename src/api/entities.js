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
  PitchDeck: createEntity('pitch_deck'),
  Investor: createEntity('investor'),
  BrandAsset: createEntity('brand_asset'),
  DataRoom: createEntity('data_room'),
  Document: createEntity('document'),
};

// AI Integration placeholder - to be replaced with self-hosted AI
export const integrations = {
  Core: {
    async InvokeLLM({ prompt, add_context_from_internet = false, response_json_schema = null }) {
      // TODO: Implement self-hosted AI agent integration
      // For now, return a placeholder response
      console.warn('AI Integration not yet implemented. Returning placeholder.');
      
      // This would be replaced with actual API call to self-hosted AI
      // For example: OpenAI API, Anthropic API, or local LLM
      throw new Error('AI Integration needs to be configured with a self-hosted AI agent');
    }
  }
};
