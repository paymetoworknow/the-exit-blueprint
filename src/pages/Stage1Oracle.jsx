import React, { useState } from 'react';
import { entities, integrations } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Lightbulb, Sparkles, Save,
  Target, TrendingUp, AlertTriangle, CheckCircle, 
  Zap, Users, DollarSign, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GlassCard from '@/components/ui/GlassCard';
import StageHeader from '@/components/ui/StageHeader';
import ConfidenceScore from '@/components/ui/ConfidenceScore';
import { useToast } from '@/components/ui/use-toast';

const industries = [
  { value: 'saas', label: 'SaaS / Software' },
  { value: 'ecommerce', label: 'E-Commerce' },
  { value: 'fintech', label: 'FinTech' },
  { value: 'healthtech', label: 'HealthTech' },
  { value: 'edtech', label: 'EdTech' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'consumer', label: 'Consumer' },
  { value: 'enterprise', label: 'Enterprise' },
  { value: 'other', label: 'Other' },
];

const businessModels = [
  { value: 'subscription', label: 'Subscription' },
  { value: 'transactional', label: 'Transactional' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'advertising', label: 'Advertising' },
  { value: 'freemium', label: 'Freemium' },
  { value: 'enterprise', label: 'Enterprise Sales' },
  { value: 'hybrid', label: 'Hybrid' },
];

export default function Stage1Oracle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('idea');
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: businesses, isLoading } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => entities.BusinessCore.list('-created_date', 1),
  });

  const { data: marketAnalysis } = useQuery({
    queryKey: ['market-analysis'],
    queryFn: () => entities.MarketAnalysis.list('-created_date', 1),
    enabled: !!businesses?.[0],
  });

  const currentBusiness = businesses?.[0];
  const currentMarket = marketAnalysis?.[0];

  const [formData, setFormData] = useState({
    business_name: '',
    tagline: '',
    industry: '',
    business_model: '',
    problem_statement: '',
    solution: '',
    target_customer: '',
    unique_value_prop: '',
  });

  React.useEffect(() => {
    if (currentBusiness) {
      setFormData({
        business_name: currentBusiness.business_name || '',
        tagline: currentBusiness.tagline || '',
        industry: currentBusiness.industry || '',
        business_model: currentBusiness.business_model || '',
        problem_statement: currentBusiness.problem_statement || '',
        solution: currentBusiness.solution || '',
        target_customer: currentBusiness.target_customer || '',
        unique_value_prop: currentBusiness.unique_value_prop || '',
      });
    }
  }, [currentBusiness]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (currentBusiness) {
        return entities.BusinessCore.update(currentBusiness.id, data);
      }
      return entities.BusinessCore.create({ ...data, current_stage: 1, confidence_score: 0 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      toast({
        title: "Success",
        description: "Business information saved successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save business information. Please try again.",
        variant: "destructive",
      });
    },
  });

  const generateAnalysisMutation = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      
      // Generate comprehensive analysis using AI
      const analysisPrompt = `Analyze this business idea and provide a comprehensive validation:

Business: ${formData.business_name}
Industry: ${formData.industry}
Business Model: ${formData.business_model}
Problem: ${formData.problem_statement}
Solution: ${formData.solution}
Target Customer: ${formData.target_customer}
Unique Value: ${formData.unique_value_prop}

Provide:
1. TAM/SAM/SOM market sizing in USD with rationale
2. Lean Canvas model
3. SWOT analysis
4. Market confidence score (0-100)
5. Top 3 competitors with brief descriptions
6. Market growth rate percentage`;

      const result = await integrations.Core.InvokeLLM({
        prompt: analysisPrompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            tam: { type: "number" },
            tam_rationale: { type: "string" },
            sam: { type: "number" },
            sam_rationale: { type: "string" },
            som: { type: "number" },
            som_rationale: { type: "string" },
            market_growth_rate: { type: "number" },
            market_confidence: { type: "number" },
            competitors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  market_share: { type: "number" }
                }
              }
            },
            lean_canvas: {
              type: "object",
              properties: {
                problem: { type: "array", items: { type: "string" } },
                solution: { type: "array", items: { type: "string" } },
                unique_value: { type: "string" },
                unfair_advantage: { type: "string" },
                customer_segments: { type: "array", items: { type: "string" } },
                key_metrics: { type: "array", items: { type: "string" } },
                channels: { type: "array", items: { type: "string" } },
                cost_structure: { type: "array", items: { type: "string" } },
                revenue_streams: { type: "array", items: { type: "string" } }
              }
            },
            swot: {
              type: "object",
              properties: {
                strengths: { type: "array", items: { type: "string" } },
                weaknesses: { type: "array", items: { type: "string" } },
                opportunities: { type: "array", items: { type: "string" } },
                threats: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      });

      // Save market analysis
      if (currentMarket) {
        await entities.MarketAnalysis.update(currentMarket.id, {
          ...result,
          business_id: currentBusiness.id
        });
      } else {
        await entities.MarketAnalysis.create({
          ...result,
          business_id: currentBusiness.id
        });
      }

      // Update business confidence score and stage
      await entities.BusinessCore.update(currentBusiness.id, {
        confidence_score: result.market_confidence,
        current_stage: result.market_confidence >= 40 ? 2 : 1,
        stage_completion: { stage1: true }
      });

      return result;
    },
    onSuccess: () => {
      setIsGenerating(false);
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      queryClient.invalidateQueries({ queryKey: ['market-analysis'] });
      setActiveTab('analysis');
      toast({
        title: "Analysis Complete!",
        description: "Your market analysis has been generated successfully.",
      });
    },
    onError: (error) => {
      setIsGenerating(false);
      console.error('Analysis generation error:', error);
      toast({
        title: "AI Generation Failed",
        description: error.message || "Failed to generate analysis. Please check your AI configuration.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const handleGenerate = () => {
    if (currentBusiness) {
      generateAnalysisMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <StageHeader
        stageNumber={1}
        title="The Oracle"
        subtitle="Validate your business idea with AI-powered market analysis"
        icon={Lightbulb}
        gradient="from-violet-500 to-purple-600"
      >
        <Button 
          variant="outline" 
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="border-white/10 hover:bg-white/5 bg-transparent text-white hover:text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Progress
        </Button>
        <Button
          onClick={handleGenerate}
          disabled={!currentBusiness || isGenerating}
          className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Analysis
            </>
          )}
        </Button>
      </StageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="idea" className="data-[state=active]:bg-white/10">
            Business Idea
          </TabsTrigger>
          <TabsTrigger value="analysis" className="data-[state=active]:bg-white/10" disabled={!currentMarket}>
            Market Analysis
          </TabsTrigger>
          <TabsTrigger value="canvas" className="data-[state=active]:bg-white/10" disabled={!currentMarket?.lean_canvas}>
            Lean Canvas
          </TabsTrigger>
          <TabsTrigger value="swot" className="data-[state=active]:bg-white/10" disabled={!currentMarket?.swot}>
            SWOT Analysis
          </TabsTrigger>
          <TabsTrigger value="competitors" className="data-[state=active]:bg-white/10">
            Competitors
          </TabsTrigger>
        </TabsList>

        <TabsContent value="idea">
          <IdeaForm formData={formData} setFormData={setFormData} />
        </TabsContent>

        <TabsContent value="analysis">
          <MarketAnalysisView market={currentMarket} business={currentBusiness} />
        </TabsContent>

        <TabsContent value="canvas">
          <LeanCanvasView canvas={currentMarket?.lean_canvas} businessName={formData.business_name} />
        </TabsContent>

        <TabsContent value="swot">
          <SwotView swot={currentMarket?.swot} />
        </TabsContent>

        <TabsContent value="competitors">
          <CompetitorAnalysisView 
            currentBusiness={currentBusiness} 
            currentMarket={currentMarket} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CompetitorAnalysisView({ currentBusiness, currentMarket }) {
  const queryClient = useQueryClient();
  const [competitorInput, setCompetitorInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!competitorInput.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const prompt = `Analyze the following competitors in the ${currentBusiness?.industry} industry:

Competitors: ${competitorInput}

For EACH competitor, provide detailed analysis using real web data:
1. Company overview and market position
2. Product/service offerings
3. Pricing strategy
4. Estimated annual revenue (real data if available)
5. Funding raised (real data if available)
6. Strengths (3-5)
7. Weaknesses (3-5)
8. Market share estimate (%)
9. Target customer segments
10. Competitive advantages`;

      const result = await integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            competitors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  overview: { type: "string" },
                  products: { type: "string" },
                  pricing_strategy: { type: "string" },
                  estimated_revenue: { type: "string" },
                  funding: { type: "string" },
                  strengths: { type: "array", items: { type: "string" } },
                  weaknesses: { type: "array", items: { type: "string" } },
                  market_share: { type: "number" },
                  target_segments: { type: "string" },
                  competitive_advantages: { type: "array", items: { type: "string" } },
                  description: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (currentMarket) {
        await entities.MarketAnalysis.update(currentMarket.id, {
          competitors: result.competitors
        });
      }

      queryClient.invalidateQueries({ queryKey: ['market-analysis'] });
      setCompetitorInput('');
    } catch (error) {
      console.error('Competitor analysis failed:', error);
    }
    setIsAnalyzing(false);
  };

  const competitors = currentMarket?.competitors || [];

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-violet-400" />
          AI-Powered Competitor Analysis
        </h3>
        <div className="flex gap-3">
          <Input
            placeholder="Enter competitor names (comma-separated, e.g., Stripe, Square, PayPal)"
            value={competitorInput}
            onChange={(e) => setCompetitorInput(e.target.value)}
            className="flex-1 bg-white/5 border-white/10"
            onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
          />
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !competitorInput.trim()}
            className="bg-gradient-to-r from-violet-500 to-purple-600"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-zinc-500 mt-2">
          AI will research competitors using web data for detailed market intelligence
        </p>
      </GlassCard>

      {competitors.length > 0 ? (
        <div className="grid lg:grid-cols-2 gap-6">
          {competitors.map((competitor, idx) => (
            <GlassCard key={idx} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{competitor.name}</h3>
                  {competitor.market_share > 0 && (
                    <Badge className="mt-1 bg-violet-500/20 text-violet-400">
                      {competitor.market_share}% Market Share
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Overview</p>
                  <p className="text-sm text-zinc-300">{competitor.overview || competitor.description}</p>
                </div>

                {(competitor.estimated_revenue || competitor.funding) && (
                  <div className="grid grid-cols-2 gap-3">
                    {competitor.estimated_revenue && (
                      <div className="p-3 rounded-lg bg-white/5">
                        <p className="text-xs text-zinc-500">Est. Revenue</p>
                        <p className="text-sm font-semibold">{competitor.estimated_revenue}</p>
                      </div>
                    )}
                    {competitor.funding && (
                      <div className="p-3 rounded-lg bg-white/5">
                        <p className="text-xs text-zinc-500">Funding</p>
                        <p className="text-sm font-semibold">{competitor.funding}</p>
                      </div>
                    )}
                  </div>
                )}

                {competitor.strengths?.length > 0 && (
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Strengths</p>
                    <ul className="space-y-1">
                      {competitor.strengths.slice(0, 3).map((strength, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                          <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {competitor.weaknesses?.length > 0 && (
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Weaknesses</p>
                    <ul className="space-y-1">
                      {competitor.weaknesses.slice(0, 3).map((weakness, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                          <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                          <span>{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {competitor.products && (
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Products & Services</p>
                    <p className="text-xs text-zinc-300">{competitor.products}</p>
                  </div>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <GlassCard className="p-12 text-center">
          <Users className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Competitors Analyzed Yet</h3>
          <p className="text-zinc-500 max-w-md mx-auto">
            Add competitor names above to get AI analysis of their positioning, strengths, and weaknesses
          </p>
        </GlassCard>
      )}
    </div>
  );
}

function IdeaForm({ formData, setFormData }) {
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <GlassCard className="p-6 space-y-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Zap className="w-5 h-5 text-violet-400" />
          Core Details
        </h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Business Name</Label>
            <Input
              id="name"
              value={formData.business_name}
              onChange={e => handleChange('business_name', e.target.value)}
              placeholder="Enter your business name"
              className="mt-1.5 bg-white/5 border-white/10 focus:border-violet-500"
            />
          </div>

          <div>
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              value={formData.tagline}
              onChange={e => handleChange('tagline', e.target.value)}
              placeholder="A catchy one-liner for your business"
              className="mt-1.5 bg-white/5 border-white/10 focus:border-violet-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Industry</Label>
              <Select value={formData.industry} onValueChange={v => handleChange('industry', v)}>
                <SelectTrigger className="mt-1.5 bg-white/5 border-white/10">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map(ind => (
                    <SelectItem key={ind.value} value={ind.value}>{ind.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Business Model</Label>
              <Select value={formData.business_model} onValueChange={v => handleChange('business_model', v)}>
                <SelectTrigger className="mt-1.5 bg-white/5 border-white/10">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {businessModels.map(model => (
                    <SelectItem key={model.value} value={model.value}>{model.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="target">Target Customer</Label>
            <Input
              id="target"
              value={formData.target_customer}
              onChange={e => handleChange('target_customer', e.target.value)}
              placeholder="Describe your ideal customer"
              className="mt-1.5 bg-white/5 border-white/10 focus:border-violet-500"
            />
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6 space-y-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Target className="w-5 h-5 text-violet-400" />
          Value Proposition
        </h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="problem">Problem Statement</Label>
            <Textarea
              id="problem"
              value={formData.problem_statement}
              onChange={e => handleChange('problem_statement', e.target.value)}
              placeholder="What problem are you solving?"
              className="mt-1.5 bg-white/5 border-white/10 focus:border-violet-500 min-h-[100px]"
            />
          </div>

          <div>
            <Label htmlFor="solution">Your Solution</Label>
            <Textarea
              id="solution"
              value={formData.solution}
              onChange={e => handleChange('solution', e.target.value)}
              placeholder="How does your product solve this problem?"
              className="mt-1.5 bg-white/5 border-white/10 focus:border-violet-500 min-h-[100px]"
            />
          </div>

          <div>
            <Label htmlFor="uvp">Unique Value Proposition</Label>
            <Textarea
              id="uvp"
              value={formData.unique_value_prop}
              onChange={e => handleChange('unique_value_prop', e.target.value)}
              placeholder="What makes you different from competitors?"
              className="mt-1.5 bg-white/5 border-white/10 focus:border-violet-500 min-h-[80px]"
            />
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

function MarketAnalysisView({ market, business }) {
  if (!market) return null;

  const formatCurrency = (num) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(1)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
    return `$${num?.toLocaleString() || 0}`;
  };

  return (
    <div className="space-y-6">
      {/* Confidence Score & Market Size */}
      <div className="grid lg:grid-cols-4 gap-6">
        <GlassCard className="p-6 flex flex-col items-center justify-center">
          <ConfidenceScore score={market.market_confidence || 0} size="md" />
        </GlassCard>

        <GlassCard className="p-6 bg-gradient-to-br from-violet-500/10 to-purple-600/10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-violet-400" />
            </div>
            <span className="text-xs text-zinc-400 uppercase tracking-wider">TAM</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(market.tam)}</p>
          <p className="text-xs text-zinc-500 mt-2 line-clamp-2">{market.tam_rationale}</p>
        </GlassCard>

        <GlassCard className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-600/10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-xs text-zinc-400 uppercase tracking-wider">SAM</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(market.sam)}</p>
          <p className="text-xs text-zinc-500 mt-2 line-clamp-2">{market.sam_rationale}</p>
        </GlassCard>

        <GlassCard className="p-6 bg-gradient-to-br from-emerald-500/10 to-teal-600/10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Target className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-xs text-zinc-400 uppercase tracking-wider">SOM</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(market.som)}</p>
          <p className="text-xs text-zinc-500 mt-2 line-clamp-2">{market.som_rationale}</p>
        </GlassCard>
      </div>

      {/* Competitors & Growth */}
      <div className="grid lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-violet-400" />
            Key Competitors
          </h3>
          <div className="space-y-3">
            {market.competitors?.map((comp, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center text-sm font-bold text-violet-400">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{comp.name}</p>
                  <p className="text-sm text-zinc-500 line-clamp-2">{comp.description}</p>
                </div>
                {comp.market_share && (
                  <span className="text-xs text-zinc-400 shrink-0">{comp.market_share}%</span>
                )}
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Market Growth
          </h3>
          <div className="flex items-center justify-center h-[200px]">
            <div className="text-center">
              <p className="text-5xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                {market.market_growth_rate || 0}%
              </p>
              <p className="text-zinc-500 mt-2">Annual Growth Rate</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function LeanCanvasView({ canvas, businessName }) {
  if (!canvas) return null;

  const sections = [
    { key: 'problem', title: 'Problem', items: canvas.problem, color: 'from-red-500/20 to-rose-600/20' },
    { key: 'solution', title: 'Solution', items: canvas.solution, color: 'from-green-500/20 to-emerald-600/20' },
    { key: 'unique_value', title: 'Unique Value Prop', items: [canvas.unique_value], color: 'from-violet-500/20 to-purple-600/20' },
    { key: 'unfair_advantage', title: 'Unfair Advantage', items: [canvas.unfair_advantage], color: 'from-amber-500/20 to-orange-600/20' },
    { key: 'customer_segments', title: 'Customer Segments', items: canvas.customer_segments, color: 'from-blue-500/20 to-cyan-600/20' },
    { key: 'key_metrics', title: 'Key Metrics', items: canvas.key_metrics, color: 'from-pink-500/20 to-rose-600/20' },
    { key: 'channels', title: 'Channels', items: canvas.channels, color: 'from-teal-500/20 to-cyan-600/20' },
    { key: 'cost_structure', title: 'Cost Structure', items: canvas.cost_structure, color: 'from-red-500/20 to-orange-600/20' },
    { key: 'revenue_streams', title: 'Revenue Streams', items: canvas.revenue_streams, color: 'from-emerald-500/20 to-green-600/20' },
  ];

  return (
    <div className="space-y-4">
      <GlassCard className="p-4 text-center">
        <h2 className="text-xl font-bold">{businessName} - Lean Canvas</h2>
      </GlassCard>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((section) => (
          <GlassCard key={section.key} className={`p-4 bg-gradient-to-br ${section.color}`}>
            <h4 className="font-semibold text-sm mb-3 text-zinc-300">{section.title}</h4>
            <ul className="space-y-1.5">
              {section.items?.map((item, idx) => (
                <li key={idx} className="text-sm text-zinc-400 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30 mt-1.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

function SwotView({ swot }) {
  if (!swot) return null;

  const quadrants = [
    { key: 'strengths', title: 'Strengths', icon: CheckCircle, items: swot.strengths, color: 'from-emerald-500 to-teal-600', iconColor: 'text-emerald-400' },
    { key: 'weaknesses', title: 'Weaknesses', icon: AlertTriangle, items: swot.weaknesses, color: 'from-amber-500 to-orange-600', iconColor: 'text-amber-400' },
    { key: 'opportunities', title: 'Opportunities', icon: TrendingUp, items: swot.opportunities, color: 'from-blue-500 to-cyan-600', iconColor: 'text-blue-400' },
    { key: 'threats', title: 'Threats', icon: AlertTriangle, items: swot.threats, color: 'from-red-500 to-rose-600', iconColor: 'text-red-400' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {quadrants.map((q) => {
        const Icon = q.icon;
        return (
          <GlassCard key={q.key} className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${q.color} flex items-center justify-center`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold">{q.title}</h3>
            </div>
            <ul className="space-y-2">
              {q.items?.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 p-2 rounded-lg bg-white/5">
                  <span className={`w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs ${q.iconColor}`}>
                    {idx + 1}
                  </span>
                  <span className="text-sm text-zinc-300">{item}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        );
      })}
    </div>
  );
}