import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Zap, Plus, Sparkles, Loader2, CheckCircle, AlertTriangle,
  TrendingUp, Target, DollarSign, Users, Clock, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';
import StageHeader from '@/components/ui/StageHeader';

const decisionTypes = [
  { value: 'strategic', label: 'Strategic Direction', icon: Target },
  { value: 'financial', label: 'Financial', icon: DollarSign },
  { value: 'operational', label: 'Operational', icon: Zap },
  { value: 'product', label: 'Product Development', icon: TrendingUp },
  { value: 'hiring', label: 'Hiring & Team', icon: Users },
];

export default function DecisionAssistant() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  const { data: businesses } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => base44.entities.BusinessCore.list('-created_date', 1),
  });

  const { data: decisions } = useQuery({
    queryKey: ['decisions'],
    queryFn: () => base44.entities.Decision.list('-created_date'),
    enabled: !!businesses?.[0],
  });

  const { data: financials } = useQuery({
    queryKey: ['financials'],
    queryFn: () => base44.entities.Financials.list('-created_date', 1),
    enabled: !!businesses?.[0],
  });

  const { data: marketData } = useQuery({
    queryKey: ['market-analysis'],
    queryFn: () => base44.entities.MarketAnalysis.list('-created_date', 1),
    enabled: !!businesses?.[0],
  });

  const currentBusiness = businesses?.[0];
  const currentFinancials = financials?.[0];
  const currentMarket = marketData?.[0];

  const analyzeDecisionMutation = useMutation({
    mutationFn: async (decisionId) => {
      const decision = decisions?.find(d => d.id === decisionId);
      if (!decision) throw new Error('Decision not found');

      const prompt = `You are a strategic business advisor. Analyze this decision for ${currentBusiness.business_name}:

DECISION CONTEXT:
Title: ${decision.decision_title}
Type: ${decision.decision_type}
Context: ${decision.context}

OPTIONS TO EVALUATE:
${decision.options.map((opt, i) => `
Option ${i + 1}: ${opt.title}
Description: ${opt.description}
`).join('\n')}

BUSINESS DATA:
Industry: ${currentBusiness.industry}
Business Model: ${currentBusiness.business_model}
Current Stage: ${currentBusiness.current_stage}/5
Confidence Score: ${currentBusiness.confidence_score}%

FINANCIAL CONTEXT:
Monthly Revenue: $${currentFinancials?.monthly_revenue || 0}
Monthly Burn: $${currentFinancials?.monthly_burn || 0}
Runway: ${currentFinancials?.runway_months || 0} months
Customer Count: ${currentFinancials?.customer_count || 0}
LTV/CAC Ratio: ${currentFinancials?.ltv_cac_ratio || 'N/A'}

MARKET CONTEXT:
TAM: $${currentMarket?.tam || 0}
Market Growth Rate: ${currentMarket?.market_growth_rate || 0}%
Competitors: ${currentMarket?.competitors?.length || 0} analyzed

For EACH option, provide:
1. Pros (3-5 key advantages)
2. Cons (3-5 key disadvantages)
3. Risk Level (low/medium/high/critical)
4. Financial Impact (estimated cost/revenue impact)
5. Time to Implement (estimated timeline)
6. Success Probability (0-100%)

Then provide:
- Overall Recommendation (which option and why)
- Key Decision Factors (what matters most)
- Implementation Roadmap (if you recommend moving forward)
- Risk Mitigation Strategies`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            options_analysis: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  option_title: { type: "string" },
                  pros: { type: "array", items: { type: "string" } },
                  cons: { type: "array", items: { type: "string" } },
                  risk_level: { type: "string" },
                  financial_impact: { type: "string" },
                  time_to_implement: { type: "string" },
                  success_probability: { type: "number" }
                }
              }
            },
            recommendation: {
              type: "object",
              properties: {
                recommended_option: { type: "string" },
                reasoning: { type: "string" },
                confidence: { type: "number" }
              }
            },
            key_factors: { type: "array", items: { type: "string" } },
            implementation_roadmap: { type: "array", items: { type: "string" } },
            risk_mitigation: { type: "array", items: { type: "string" } }
          }
        }
      });

      await base44.entities.Decision.update(decisionId, {
        ai_analysis: result,
        status: 'reviewed'
      });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decisions'] });
    },
  });

  const createDecisionMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.Decision.create({
        ...data,
        business_id: currentBusiness.id,
        status: 'analyzing'
      });
    },
    onSuccess: (newDecision) => {
      queryClient.invalidateQueries({ queryKey: ['decisions'] });
      setIsCreating(false);
      // Auto-analyze the new decision
      analyzeDecisionMutation.mutate(newDecision.id);
    },
  });

  const businessDecisions = decisions?.filter(d => d.business_id === currentBusiness?.id) || [];

  return (
    <div className="max-w-7xl mx-auto">
      <StageHeader
        stageNumber="AI"
        title="Decision Assistant"
        subtitle="AI-powered strategic decision analysis and recommendations"
        icon={Zap}
        gradient="from-violet-500 to-purple-600"
      >
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-gradient-to-r from-violet-500 to-purple-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Decision
        </Button>
      </StageHeader>

      {isCreating && (
        <div className="mb-6">
          <DecisionForm 
            onSubmit={(data) => createDecisionMutation.mutate(data)}
            onCancel={() => setIsCreating(false)}
            isLoading={createDecisionMutation.isPending}
          />
        </div>
      )}

      <div className="space-y-6">
        {businessDecisions.length === 0 && !isCreating ? (
          <GlassCard className="p-12 text-center">
            <Zap className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Decisions to Analyze</h3>
            <p className="text-zinc-500 max-w-md mx-auto mb-6">
              Use AI to compare strategic options, evaluate trade-offs, and make data-driven decisions
            </p>
            <Button
              onClick={() => setIsCreating(true)}
              className="bg-gradient-to-r from-violet-500 to-purple-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Decision
            </Button>
          </GlassCard>
        ) : (
          businessDecisions.map((decision) => (
            <DecisionCard
              key={decision.id}
              decision={decision}
              onAnalyze={() => analyzeDecisionMutation.mutate(decision.id)}
              isAnalyzing={analyzeDecisionMutation.isPending}
            />
          ))
        )}
      </div>
    </div>
  );
}

function DecisionForm({ onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    decision_title: '',
    decision_type: 'strategic',
    context: '',
    options: [
      { title: '', description: '' },
      { title: '', description: '' }
    ]
  });

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { title: '', description: '' }]
    }));
  };

  const updateOption = (idx, field, value) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => 
        i === idx ? { ...opt, [field]: value } : opt
      )
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <GlassCard className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <Label>Decision Title</Label>
            <Input
              value={formData.decision_title}
              onChange={e => setFormData(p => ({ ...p, decision_title: e.target.value }))}
              placeholder="e.g., Choose pricing model"
              required
              className="mt-1.5 bg-white/5 border-white/10"
            />
          </div>
          <div>
            <Label>Decision Type</Label>
            <Select value={formData.decision_type} onValueChange={v => setFormData(p => ({ ...p, decision_type: v }))}>
              <SelectTrigger className="mt-1.5 bg-white/5 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {decisionTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Context & Background</Label>
          <Textarea
            value={formData.context}
            onChange={e => setFormData(p => ({ ...p, context: e.target.value }))}
            placeholder="Provide context about this decision, constraints, and what you're trying to achieve..."
            required
            className="mt-1.5 bg-white/5 border-white/10 min-h-[100px]"
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Options to Evaluate</Label>
            <Button type="button" variant="outline" size="sm" onClick={addOption} className="border-white/10">
              <Plus className="w-4 h-4 mr-2" />
              Add Option
            </Button>
          </div>

          {formData.options.map((option, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-3">
              <Input
                value={option.title}
                onChange={e => updateOption(idx, 'title', e.target.value)}
                placeholder={`Option ${idx + 1} title`}
                required
                className="bg-white/5 border-white/10"
              />
              <Textarea
                value={option.description}
                onChange={e => updateOption(idx, 'description', e.target.value)}
                placeholder="Describe this option in detail..."
                required
                className="bg-white/5 border-white/10"
                rows={2}
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onCancel} className="border-white/10">
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600">
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Analyze with AI
          </Button>
        </div>
      </form>
    </GlassCard>
  );
}

function DecisionCard({ decision, onAnalyze, isAnalyzing }) {
  const decisionType = decisionTypes.find(t => t.value === decision.decision_type);
  const Icon = decisionType?.icon || Zap;

  return (
    <GlassCard className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">{decision.decision_title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="border-white/10">{decisionType?.label}</Badge>
              <Badge className={
                decision.status === 'decided' ? 'bg-emerald-500/20 text-emerald-400' :
                decision.status === 'reviewed' ? 'bg-blue-500/20 text-blue-400' :
                'bg-zinc-500/20 text-zinc-400'
              }>
                {decision.status}
              </Badge>
            </div>
          </div>
        </div>

        {decision.status === 'analyzing' && (
          <Button
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className="bg-gradient-to-r from-violet-500 to-purple-600"
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          </Button>
        )}
      </div>

      <p className="text-sm text-zinc-400 mb-6">{decision.context}</p>

      {/* Options */}
      <div className="space-y-3 mb-6">
        <h4 className="text-sm font-semibold text-zinc-400">Options Under Consideration:</h4>
        {decision.options?.map((opt, idx) => (
          <div key={idx} className="p-3 rounded-lg bg-white/5 border border-white/10">
            <p className="font-medium">{opt.title}</p>
            <p className="text-sm text-zinc-400 mt-1">{opt.description}</p>
          </div>
        ))}
      </div>

      {/* AI Analysis */}
      {decision.ai_analysis && (
        <div className="space-y-6 pt-6 border-t border-white/10">
          {/* Recommendation */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-600/10 border border-violet-500/20">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-violet-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-violet-400 mb-1">AI Recommendation</h4>
                <p className="text-lg font-medium mb-2">{decision.ai_analysis.recommendation?.recommended_option}</p>
                <p className="text-sm text-zinc-300">{decision.ai_analysis.recommendation?.reasoning}</p>
                <div className="mt-3">
                  <Badge className="bg-violet-500/20 text-violet-400">
                    {decision.ai_analysis.recommendation?.confidence}% Confidence
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Options Comparison */}
          <div className="grid lg:grid-cols-2 gap-4">
            {decision.ai_analysis.options_analysis?.map((analysis, idx) => {
              const riskColors = {
                low: 'text-emerald-400',
                medium: 'text-amber-400',
                high: 'text-orange-400',
                critical: 'text-red-400'
              };

              return (
                <div key={idx} className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <h5 className="font-semibold mb-3">{analysis.option_title}</h5>
                  
                  <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
                    <div className="text-center p-2 rounded bg-white/5">
                      <p className={riskColors[analysis.risk_level] || 'text-zinc-400'}>
                        {analysis.risk_level?.toUpperCase()}
                      </p>
                      <p className="text-zinc-500">Risk</p>
                    </div>
                    <div className="text-center p-2 rounded bg-white/5">
                      <p className="text-blue-400">{analysis.success_probability}%</p>
                      <p className="text-zinc-500">Success</p>
                    </div>
                    <div className="text-center p-2 rounded bg-white/5">
                      <p className="text-zinc-300">{analysis.time_to_implement}</p>
                      <p className="text-zinc-500">Timeline</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-emerald-400 font-medium mb-1">Pros:</p>
                      <ul className="space-y-1">
                        {analysis.pros?.slice(0, 3).map((pro, i) => (
                          <li key={i} className="text-xs text-zinc-400 flex items-start gap-1">
                            <span className="text-emerald-400">+</span> {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs text-red-400 font-medium mb-1">Cons:</p>
                      <ul className="space-y-1">
                        {analysis.cons?.slice(0, 3).map((con, i) => (
                          <li key={i} className="text-xs text-zinc-400 flex items-start gap-1">
                            <span className="text-red-400">-</span> {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Implementation Roadmap */}
          {decision.ai_analysis.implementation_roadmap && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-violet-400" />
                Implementation Roadmap
              </h4>
              <ol className="space-y-2">
                {decision.ai_analysis.implementation_roadmap.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm">
                    <span className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center shrink-0 text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-zinc-300">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}