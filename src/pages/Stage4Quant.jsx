import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Calculator, DollarSign, TrendingUp, TrendingDown, 
  Users, Target, Percent, PiggyBank, Save,
  ArrowUpRight, ArrowDownRight, Wallet, LineChart,
  Loader2, AlertCircle, CheckCircle, Sparkles, BarChart3, GitBranch, RefreshCw
} from 'lucide-react';
import { LineChart as RechartsLine, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GlassCard from '@/components/ui/GlassCard';
import StageHeader from '@/components/ui/StageHeader';

// Industry valuation multipliers (revenue-based)
const INDUSTRY_MULTIPLIERS = {
  saas: { multiplier: 8, name: 'SaaS / Software', type: 'ARR' },
  ecommerce: { multiplier: 4, name: 'E-Commerce', type: 'Revenue' },
  fintech: { multiplier: 10, name: 'FinTech', type: 'ARR' },
  healthtech: { multiplier: 7, name: 'HealthTech', type: 'ARR' },
  edtech: { multiplier: 6, name: 'EdTech', type: 'ARR' },
  marketplace: { multiplier: 5, name: 'Marketplace', type: 'GMV' },
  consumer: { multiplier: 3, name: 'Consumer', type: 'Revenue' },
  enterprise: { multiplier: 8, name: 'Enterprise', type: 'ARR' },
  other: { multiplier: 4, name: 'Other', type: 'Revenue' },
};

export default function Stage4Quant() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('current');
  const [scenarios, setScenarios] = useState(null);
  const [isGeneratingProjections, setIsGeneratingProjections] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState('moderate');
  const [customAssumptions, setCustomAssumptions] = useState({
    conservative: { y1: 50, y2: 40, y3: 30, margin: 3 },
    moderate: { y1: 100, y2: 80, y3: 60, margin: 5 },
    aggressive: { y1: 150, y2: 120, y3: 100, margin: 8 },
  });

  const { data: businesses, isLoading: loadingBusiness } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => base44.entities.BusinessCore.list('-created_date', 1),
  });

  const { data: financials, isLoading: loadingFinancials } = useQuery({
    queryKey: ['financials'],
    queryFn: () => base44.entities.Financials.list('-created_date', 1),
    enabled: !!businesses?.[0],
  });

  const { data: marketAnalysis } = useQuery({
    queryKey: ['market-analysis'],
    queryFn: () => base44.entities.MarketAnalysis.list('-created_date', 1),
    enabled: !!businesses?.[0],
  });

  const currentBusiness = businesses?.[0];
  const currentFinancials = financials?.[0];
  const currentMarket = marketAnalysis?.[0];
  const industry = currentBusiness?.industry || 'other';

  const [formData, setFormData] = useState({
    monthly_revenue: 0,
    monthly_burn: 0,
    cash_on_hand: 0,
    cac: 0,
    customer_count: 0,
    churn_rate: 5,
    gross_margin: 70,
    arpu: 0,
    funding_raised: 0,
  });

  useEffect(() => {
    if (currentFinancials) {
      setFormData({
        monthly_revenue: currentFinancials.monthly_revenue || 0,
        monthly_burn: currentFinancials.monthly_burn || 0,
        cash_on_hand: currentFinancials.cash_on_hand || 0,
        cac: currentFinancials.cac || 0,
        customer_count: currentFinancials.customer_count || 0,
        churn_rate: currentFinancials.churn_rate || 5,
        gross_margin: currentFinancials.gross_margin || 70,
        arpu: currentFinancials.arpu || 0,
        funding_raised: currentFinancials.funding_raised || 0,
      });
    }
  }, [currentFinancials]);

  // Calculated metrics (no AI calls - pure logic)
  const calculations = React.useMemo(() => {
    const { monthly_revenue, monthly_burn, cash_on_hand, cac, customer_count, churn_rate, gross_margin, arpu } = formData;
    
    // Annual revenue
    const annual_revenue = monthly_revenue * 12;
    
    // Runway calculation
    const net_burn = monthly_burn - monthly_revenue;
    const runway_months = net_burn > 0 && cash_on_hand > 0 
      ? Math.floor(cash_on_hand / net_burn) 
      : net_burn <= 0 ? 999 : 0;
    
    // LTV calculation: ARPU / Churn Rate (monthly) = LTV
    const monthly_churn_decimal = (churn_rate || 5) / 100;
    const customer_arpu = arpu > 0 ? arpu : (customer_count > 0 ? monthly_revenue / customer_count : 0);
    const ltv = monthly_churn_decimal > 0 ? customer_arpu / monthly_churn_decimal : 0;
    
    // LTV/CAC ratio
    const ltv_cac_ratio = cac > 0 ? ltv / cac : 0;
    
    // Valuation calculation
    const industryData = INDUSTRY_MULTIPLIERS[industry] || INDUSTRY_MULTIPLIERS.other;
    const valuation = annual_revenue * industryData.multiplier;
    
    // Health scores
    const ltv_cac_health = ltv_cac_ratio >= 3 ? 'excellent' : ltv_cac_ratio >= 2 ? 'good' : ltv_cac_ratio >= 1 ? 'warning' : 'critical';
    const runway_health = runway_months >= 18 ? 'excellent' : runway_months >= 12 ? 'good' : runway_months >= 6 ? 'warning' : 'critical';
    const burn_health = net_burn <= 0 ? 'excellent' : net_burn < monthly_revenue * 0.5 ? 'good' : 'warning';
    
    return {
      annual_revenue,
      runway_months,
      ltv,
      ltv_cac_ratio,
      valuation,
      valuation_multiplier: industryData.multiplier,
      net_burn,
      customer_arpu,
      ltv_cac_health,
      runway_health,
      burn_health,
      industryData,
    };
  }, [formData, industry]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const financialData = {
        ...data,
        business_id: currentBusiness.id,
        annual_revenue: calculations.annual_revenue,
        runway_months: calculations.runway_months,
        ltv: calculations.ltv,
        ltv_cac_ratio: calculations.ltv_cac_ratio,
        valuation: calculations.valuation,
        valuation_multiplier: calculations.valuation_multiplier,
      };

      if (currentFinancials) {
        return base44.entities.Financials.update(currentFinancials.id, financialData);
      }
      return base44.entities.Financials.create(financialData);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['financials'] });
      // Update business stage
      if (currentBusiness && currentBusiness.current_stage < 5) {
        await base44.entities.BusinessCore.update(currentBusiness.id, {
          current_stage: Math.max(currentBusiness.current_stage, 5),
          stage_completion: { ...currentBusiness.stage_completion, stage4: true }
        });
        queryClient.invalidateQueries({ queryKey: ['businesses'] });
      }
    },
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  if (loadingBusiness || loadingFinancials) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const formatCurrency = (num) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
    return `$${num.toFixed(0)}`;
  };

  const generateScenarios = async () => {
    setIsGeneratingProjections(true);
    try {
      const prompt = `Generate THREE scenario-based 5-year financial projections for ${currentBusiness?.business_name}:

CURRENT FINANCIALS:
Annual Revenue: $${calculations.annual_revenue}
Monthly Revenue: $${formData.monthly_revenue}
Monthly Burn: $${formData.monthly_burn}
Cash on Hand: $${formData.cash_on_hand}
Gross Margin: ${formData.gross_margin}%
Customer Count: ${formData.customer_count}
ARPU: $${calculations.customer_arpu}
CAC: $${formData.cac}
Churn Rate: ${formData.churn_rate}%

MARKET DATA:
Industry: ${currentBusiness?.industry}
Market Growth Rate: ${currentMarket?.market_growth_rate || 15}% annually
TAM: $${currentMarket?.tam || 0}

COMPETITIVE LANDSCAPE:
${currentMarket?.competitors?.length > 0 ? 
  `Key Competitors:\n${currentMarket.competitors.map(c => 
    `- ${c.name}: Market Share ${c.market_share}%, Revenue: ${c.estimated_revenue || 'N/A'}, Strengths: ${c.strengths?.join(', ')}`
  ).join('\n')}

Consider competitive dynamics in growth assumptions. Factor in:
- Competitive pressure on pricing and margins
- Market share capture from weaker competitors
- Defensive strategies needed against stronger players` 
  : 'No detailed competitor analysis available - use industry benchmarks'
}

Generate THREE scenarios with DIFFERENT growth assumptions:

SCENARIO 1 - CONSERVATIVE (Market headwinds, slower adoption):
Year 1 Growth: ${customAssumptions.conservative.y1}%
Year 2 Growth: ${customAssumptions.conservative.y2}%
Year 3+ Growth: ${customAssumptions.conservative.y3}%
Margin Improvement: ${customAssumptions.conservative.margin}% annually
Assumptions: Higher churn, slower customer acquisition, cautious expansion

SCENARIO 2 - MODERATE (Base case, realistic expectations):
Year 1 Growth: ${customAssumptions.moderate.y1}%
Year 2 Growth: ${customAssumptions.moderate.y2}%
Year 3+ Growth: ${customAssumptions.moderate.y3}%
Margin Improvement: ${customAssumptions.moderate.margin}% annually
Assumptions: Steady growth, normal market conditions, balanced execution

SCENARIO 3 - AGGRESSIVE (Market tailwinds, rapid scaling):
Year 1 Growth: ${customAssumptions.aggressive.y1}%
Year 2 Growth: ${customAssumptions.aggressive.y2}%
Year 3+ Growth: ${customAssumptions.aggressive.y3}%
Margin Improvement: ${customAssumptions.aggressive.margin}% annually
Assumptions: Viral growth, strong product-market fit, aggressive expansion

For EACH scenario, generate 6 years of data (Year 0 = current, Years 1-5 = projections):
- Revenue (compound growth)
- COGS (improving margins)
- Operating Expenses (scales with revenue)
- EBITDA
- Net Income (25% tax rate)
- Cash Flow
- Customer Count
- Runway Months (based on cash burn and cash on hand)
- Key metrics

Calculate industry-standard valuation multiplier for Year 5.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            conservative: {
              type: "object",
              properties: {
                scenario_name: { type: "string" },
                description: { type: "string" },
                years: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      year: { type: "string" },
                      revenue: { type: "number" },
                      cogs: { type: "number" },
                      operating_expenses: { type: "number" },
                      ebitda: { type: "number" },
                      net_income: { type: "number" },
                      cash_flow: { type: "number" },
                      customer_count: { type: "number" },
                      runway_months: { type: "number" },
                      gross_margin_percent: { type: "number" }
                    }
                  }
                },
                year_5_valuation: { type: "number" },
                revenue_cagr: { type: "number" },
                breakeven_year: { type: "string" }
              }
            },
            moderate: {
              type: "object",
              properties: {
                scenario_name: { type: "string" },
                description: { type: "string" },
                years: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      year: { type: "string" },
                      revenue: { type: "number" },
                      cogs: { type: "number" },
                      operating_expenses: { type: "number" },
                      ebitda: { type: "number" },
                      net_income: { type: "number" },
                      cash_flow: { type: "number" },
                      customer_count: { type: "number" },
                      runway_months: { type: "number" },
                      gross_margin_percent: { type: "number" }
                    }
                  }
                },
                year_5_valuation: { type: "number" },
                revenue_cagr: { type: "number" },
                breakeven_year: { type: "string" }
              }
            },
            aggressive: {
              type: "object",
              properties: {
                scenario_name: { type: "string" },
                description: { type: "string" },
                years: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      year: { type: "string" },
                      revenue: { type: "number" },
                      cogs: { type: "number" },
                      operating_expenses: { type: "number" },
                      ebitda: { type: "number" },
                      net_income: { type: "number" },
                      cash_flow: { type: "number" },
                      customer_count: { type: "number" },
                      runway_months: { type: "number" },
                      gross_margin_percent: { type: "number" }
                    }
                  }
                },
                year_5_valuation: { type: "number" },
                revenue_cagr: { type: "number" },
                breakeven_year: { type: "string" }
              }
            }
          }
        }
      });

      setScenarios(result);
    } catch (error) {
      console.error('Scenario generation failed:', error);
    }
    setIsGeneratingProjections(false);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <StageHeader
        stageNumber={4}
        title="The Quant"
        subtitle="Financial engineering and valuation modeling"
        icon={Calculator}
        gradient="from-amber-500 to-orange-500"
      >
        <Button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
        >
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Financials
        </Button>
      </StageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="current" className="data-[state=active]:bg-white/10">
            <Calculator className="w-4 h-4 mr-2" />
            Current Metrics
          </TabsTrigger>
          <TabsTrigger value="projections" className="data-[state=active]:bg-white/10">
            <BarChart3 className="w-4 h-4 mr-2" />
            5-Year Projections
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === 'projections' ? (
        <ScenariosView
          scenarios={scenarios}
          isGenerating={isGeneratingProjections}
          onGenerate={generateScenarios}
          customAssumptions={customAssumptions}
          setCustomAssumptions={setCustomAssumptions}
          selectedScenario={selectedScenario}
          setSelectedScenario={setSelectedScenario}
          formatCurrency={formatCurrency}
          industryMultiplier={calculations.valuation_multiplier}
        />
      ) : (
        <>
          {/* Valuation Hero Card */}
          <GlassCard className="p-8 mb-8 bg-gradient-to-br from-amber-500/10 to-orange-600/10 border-amber-500/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="text-sm text-amber-400 uppercase tracking-wider mb-1">Current Market Valuation</p>
            <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              {formatCurrency(calculations.valuation)}
            </h2>
            <p className="text-zinc-400 mt-2">
              Based on {calculations.industryData.name} industry ({calculations.valuation_multiplier}x {calculations.industryData.type})
            </p>
          </div>
          <div className="flex gap-4">
            <div className="text-center px-6 py-4 rounded-xl bg-white/5">
              <p className="text-2xl font-bold text-white">{formatCurrency(calculations.annual_revenue)}</p>
              <p className="text-xs text-zinc-500">Annual Revenue</p>
            </div>
            <div className="text-center px-6 py-4 rounded-xl bg-white/5">
              <p className="text-2xl font-bold text-white">{calculations.valuation_multiplier}x</p>
              <p className="text-xs text-zinc-500">Multiplier</p>
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Input Form */}
        <GlassCard className="lg:col-span-2 p-6">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-400" />
            Financial Inputs
          </h3>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label className="text-zinc-400">Monthly Revenue (MRR)</Label>
              <div className="relative mt-1.5">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  type="number"
                  value={formData.monthly_revenue}
                  onChange={e => handleChange('monthly_revenue', e.target.value)}
                  className="pl-9 bg-white/5 border-white/10 focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <Label className="text-zinc-400">Monthly Burn Rate</Label>
              <div className="relative mt-1.5">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  type="number"
                  value={formData.monthly_burn}
                  onChange={e => handleChange('monthly_burn', e.target.value)}
                  className="pl-9 bg-white/5 border-white/10 focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <Label className="text-zinc-400">Cash on Hand</Label>
              <div className="relative mt-1.5">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  type="number"
                  value={formData.cash_on_hand}
                  onChange={e => handleChange('cash_on_hand', e.target.value)}
                  className="pl-9 bg-white/5 border-white/10 focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <Label className="text-zinc-400">Customer Acquisition Cost (CAC)</Label>
              <div className="relative mt-1.5">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  type="number"
                  value={formData.cac}
                  onChange={e => handleChange('cac', e.target.value)}
                  className="pl-9 bg-white/5 border-white/10 focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <Label className="text-zinc-400">Total Customers</Label>
              <div className="relative mt-1.5">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  type="number"
                  value={formData.customer_count}
                  onChange={e => handleChange('customer_count', e.target.value)}
                  className="pl-9 bg-white/5 border-white/10 focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <Label className="text-zinc-400">ARPU (Monthly)</Label>
              <div className="relative mt-1.5">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  type="number"
                  value={formData.arpu}
                  onChange={e => handleChange('arpu', e.target.value)}
                  className="pl-9 bg-white/5 border-white/10 focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <Label className="text-zinc-400">Monthly Churn Rate (%)</Label>
              <div className="relative mt-1.5">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  type="number"
                  step="0.1"
                  value={formData.churn_rate}
                  onChange={e => handleChange('churn_rate', e.target.value)}
                  className="pl-9 bg-white/5 border-white/10 focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <Label className="text-zinc-400">Gross Margin (%)</Label>
              <div className="relative mt-1.5">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  type="number"
                  value={formData.gross_margin}
                  onChange={e => handleChange('gross_margin', e.target.value)}
                  className="pl-9 bg-white/5 border-white/10 focus:border-amber-500"
                />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Health Indicators */}
        <div className="space-y-4">
          <HealthCard
            title="LTV/CAC Ratio"
            value={calculations.ltv_cac_ratio.toFixed(2)}
            health={calculations.ltv_cac_health}
            description={calculations.ltv_cac_ratio >= 3 ? "Excellent unit economics" : calculations.ltv_cac_ratio >= 2 ? "Good unit economics" : "Needs improvement"}
            icon={Target}
          />
          <HealthCard
            title="Runway"
            value={calculations.runway_months >= 999 ? "∞" : `${calculations.runway_months} mo`}
            health={calculations.runway_health}
            description={calculations.runway_months >= 18 ? "Strong runway" : calculations.runway_months >= 12 ? "Adequate runway" : "Consider fundraising"}
            icon={PiggyBank}
          />
          <HealthCard
            title="Net Burn"
            value={formatCurrency(Math.abs(calculations.net_burn))}
            health={calculations.burn_health}
            description={calculations.net_burn <= 0 ? "Cash flow positive!" : "Monthly cash burn"}
            icon={calculations.net_burn <= 0 ? TrendingUp : TrendingDown}
            positive={calculations.net_burn <= 0}
          />
        </div>
      </div>

      {/* Unit Economics Detail */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Customer LTV"
          value={formatCurrency(calculations.ltv)}
          icon={Users}
          gradient="from-violet-500/20 to-purple-600/20"
        />
        <MetricCard
          label="CAC"
          value={formatCurrency(formData.cac)}
          icon={DollarSign}
          gradient="from-blue-500/20 to-cyan-600/20"
        />
        <MetricCard
          label="ARPU"
          value={formatCurrency(calculations.customer_arpu)}
          icon={Wallet}
          gradient="from-emerald-500/20 to-teal-600/20"
        />
        <MetricCard
          label="Gross Margin"
          value={`${formData.gross_margin}%`}
          icon={Percent}
          gradient="from-amber-500/20 to-orange-600/20"
        />
      </div>

      {/* Industry Multipliers Reference */}
      <GlassCard className="p-6 mt-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <LineChart className="w-5 h-5 text-amber-400" />
          Industry Valuation Multipliers
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(INDUSTRY_MULTIPLIERS).map(([key, data]) => (
            <div 
              key={key}
              className={`p-3 rounded-lg border ${key === industry ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/5 border-white/5'}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm">{data.name}</span>
                <span className={`font-bold ${key === industry ? 'text-amber-400' : 'text-zinc-400'}`}>
                  {data.multiplier}x
                </span>
              </div>
              <p className="text-xs text-zinc-500">{data.type}</p>
            </div>
          ))}
        </div>
      </GlassCard>
        </>
      )}
    </div>
  );
}

function ScenariosView({ scenarios, isGenerating, onGenerate, customAssumptions, setCustomAssumptions, selectedScenario, setSelectedScenario, formatCurrency, industryMultiplier }) {
  if (!scenarios && !isGenerating) {
    return (
      <div className="space-y-6">
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-amber-400" />
            Scenario Assumptions
          </h3>
          <div className="grid lg:grid-cols-3 gap-6">
            {['conservative', 'moderate', 'aggressive'].map((scenario) => (
              <div key={scenario} className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-sm font-semibold mb-3 capitalize">{scenario}</p>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-zinc-500">Y1 Growth %</Label>
                    <Input
                      type="number"
                      value={customAssumptions[scenario].y1}
                      onChange={e => setCustomAssumptions(p => ({ 
                        ...p, 
                        [scenario]: { ...p[scenario], y1: parseFloat(e.target.value) || 0 }
                      }))}
                      className="mt-1 bg-white/5 border-white/10 h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-500">Y2 Growth %</Label>
                    <Input
                      type="number"
                      value={customAssumptions[scenario].y2}
                      onChange={e => setCustomAssumptions(p => ({ 
                        ...p, 
                        [scenario]: { ...p[scenario], y2: parseFloat(e.target.value) || 0 }
                      }))}
                      className="mt-1 bg-white/5 border-white/10 h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-500">Y3+ Growth %</Label>
                    <Input
                      type="number"
                      value={customAssumptions[scenario].y3}
                      onChange={e => setCustomAssumptions(p => ({ 
                        ...p, 
                        [scenario]: { ...p[scenario], y3: parseFloat(e.target.value) || 0 }
                      }))}
                      className="mt-1 bg-white/5 border-white/10 h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-500">Margin Improve %</Label>
                    <Input
                      type="number"
                      value={customAssumptions[scenario].margin}
                      onChange={e => setCustomAssumptions(p => ({ 
                        ...p, 
                        [scenario]: { ...p[scenario], margin: parseFloat(e.target.value) || 0 }
                      }))}
                      className="mt-1 bg-white/5 border-white/10 h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-12 text-center">
          <GitBranch className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Generate Scenario Analysis</h3>
          <p className="text-zinc-500 mb-6 max-w-md mx-auto">
            AI will create three distinct 5-year scenarios (Conservative, Moderate, Aggressive) based on different market conditions.
          </p>
          <Button
            onClick={onGenerate}
            className="bg-gradient-to-r from-amber-500 to-orange-500"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Scenarios
          </Button>
        </GlassCard>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <GlassCard className="p-12 text-center">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Generating Scenario Analysis...</h3>
        <p className="text-zinc-500">Creating conservative, moderate, and aggressive projections</p>
      </GlassCard>
    );
  }

  const currentScenario = scenarios[selectedScenario];
  
  // Comparison data for all scenarios
  const comparisonData = scenarios.conservative.years.map((_, idx) => ({
    year: scenarios.conservative.years[idx].year,
    Conservative: scenarios.conservative.years[idx].revenue,
    Moderate: scenarios.moderate.years[idx].revenue,
    Aggressive: scenarios.aggressive.years[idx].revenue,
  }));

  const chartData = currentScenario.years.map(y => ({
    year: y.year,
    Revenue: y.revenue,
    EBITDA: y.ebitda,
    'Net Income': y.net_income,
    'Cash Flow': y.cash_flow,
  }));

  return (
    <div className="space-y-6">
      {/* Scenario Selector */}
      <div className="flex gap-2">
        {['conservative', 'moderate', 'aggressive'].map((scenario) => (
          <Button
            key={scenario}
            onClick={() => setSelectedScenario(scenario)}
            variant={selectedScenario === scenario ? 'default' : 'outline'}
            className={selectedScenario === scenario 
              ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
              : 'border-white/10'
            }
          >
            {scenario.charAt(0).toUpperCase() + scenario.slice(1)}
          </Button>
        ))}
      </div>

      {/* Scenario Comparison Summary */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold mb-4">Scenario Comparison - Year 5</h3>
        <div className="grid grid-cols-3 gap-4">
          {['conservative', 'moderate', 'aggressive'].map((scenario) => (
            <div 
              key={scenario}
              className={`p-4 rounded-xl border ${selectedScenario === scenario ? 'border-amber-500/30 bg-amber-500/10' : 'border-white/10 bg-white/5'}`}
            >
              <p className="text-xs text-zinc-500 uppercase mb-2">{scenario}</p>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-zinc-400">Valuation</p>
                  <p className="text-lg font-bold">{formatCurrency(scenarios[scenario].year_5_valuation)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400">Revenue</p>
                  <p className="text-sm font-semibold">{formatCurrency(scenarios[scenario].years[5]?.revenue)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400">Runway Y5</p>
                  <p className="text-sm">{scenarios[scenario].years[5]?.runway_months || 0} mo</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400">CAGR</p>
                  <p className="text-sm text-emerald-400">{scenarios[scenario].revenue_cagr?.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Current Scenario Details */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4 bg-gradient-to-br from-emerald-500/10 to-teal-600/10">
          <p className="text-xs text-zinc-400 mb-1">Revenue CAGR</p>
          <p className="text-2xl font-bold text-emerald-400">{currentScenario.revenue_cagr?.toFixed(1)}%</p>
        </GlassCard>
        <GlassCard className="p-4 bg-gradient-to-br from-violet-500/10 to-purple-600/10">
          <p className="text-xs text-zinc-400 mb-1">Year 5 Revenue</p>
          <p className="text-2xl font-bold text-violet-400">{formatCurrency(currentScenario.years[5]?.revenue)}</p>
        </GlassCard>
        <GlassCard className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-600/10">
          <p className="text-xs text-zinc-400 mb-1">Breakeven</p>
          <p className="text-2xl font-bold text-blue-400">{currentScenario.breakeven_year || 'N/A'}</p>
        </GlassCard>
        <GlassCard className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-600/10">
          <p className="text-xs text-zinc-400 mb-1">Year 5 Valuation</p>
          <p className="text-2xl font-bold text-amber-400">{formatCurrency(currentScenario.year_5_valuation)}</p>
        </GlassCard>
      </div>

      {/* Revenue Comparison Across Scenarios */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold mb-4">Revenue Projection - All Scenarios</h3>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsLine data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="year" stroke="#71717A" />
            <YAxis stroke="#71717A" tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#18181B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              formatter={(value) => formatCurrency(value)}
            />
            <Legend />
            <Line type="monotone" dataKey="Conservative" stroke="#EF4444" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="Moderate" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="Aggressive" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
          </RechartsLine>
        </ResponsiveContainer>
      </GlassCard>

      {/* Revenue Chart */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold mb-4">Revenue & Profitability Projection</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorEBITDA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="year" stroke="#71717A" />
            <YAxis stroke="#71717A" tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#18181B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              formatter={(value) => formatCurrency(value)}
            />
            <Legend />
            <Area type="monotone" dataKey="Revenue" stroke="#10B981" fillOpacity={1} fill="url(#colorRevenue)" />
            <Area type="monotone" dataKey="EBITDA" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorEBITDA)" />
          </AreaChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* Cash Flow Chart */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold mb-4">Cash Flow Projection</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="year" stroke="#71717A" />
            <YAxis stroke="#71717A" tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#18181B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              formatter={(value) => formatCurrency(value)}
            />
            <Legend />
            <Bar dataKey="Cash Flow" fill="#3B82F6" />
            <Bar dataKey="Net Income" fill="#14B8A6" />
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* Detailed Table - Current Scenario */}
      <GlassCard className="p-6 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4">Detailed Projections - {currentScenario.scenario_name}</h3>
        <p className="text-sm text-zinc-400 mb-4">{currentScenario.description}</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-2 text-zinc-400 font-medium">Metric</th>
              {currentScenario.years.map((y, idx) => (
                <th key={idx} className="text-right py-3 px-2 text-zinc-400 font-medium">{y.year}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-white/10">
              <td className="py-3 px-2 font-medium">Revenue</td>
              {currentScenario.years.map((y, idx) => (
                <td key={idx} className="text-right py-3 px-2">{formatCurrency(y.revenue)}</td>
              ))}
            </tr>
            <tr className="border-b border-white/10">
              <td className="py-3 px-2 text-zinc-400">COGS</td>
              {currentScenario.years.map((y, idx) => (
                <td key={idx} className="text-right py-3 px-2 text-zinc-400">{formatCurrency(y.cogs)}</td>
              ))}
            </tr>
            <tr className="border-b border-white/10">
              <td className="py-3 px-2 text-zinc-400">Operating Expenses</td>
              {currentScenario.years.map((y, idx) => (
                <td key={idx} className="text-right py-3 px-2 text-zinc-400">{formatCurrency(y.operating_expenses)}</td>
              ))}
            </tr>
            <tr className="border-b border-white/10">
              <td className="py-3 px-2 font-medium">EBITDA</td>
              {currentScenario.years.map((y, idx) => (
                <td key={idx} className={`text-right py-3 px-2 font-medium ${y.ebitda >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatCurrency(y.ebitda)}
                </td>
              ))}
            </tr>
            <tr className="border-b border-white/10">
              <td className="py-3 px-2 font-medium">Net Income</td>
              {currentScenario.years.map((y, idx) => (
                <td key={idx} className={`text-right py-3 px-2 font-medium ${y.net_income >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatCurrency(y.net_income)}
                </td>
              ))}
            </tr>
            <tr className="border-b border-white/10">
              <td className="py-3 px-2">Gross Margin %</td>
              {currentScenario.years.map((y, idx) => (
                <td key={idx} className="text-right py-3 px-2">{y.gross_margin_percent?.toFixed(1)}%</td>
              ))}
            </tr>
            <tr className="border-b border-white/10">
              <td className="py-3 px-2">Customers</td>
              {currentScenario.years.map((y, idx) => (
                <td key={idx} className="text-right py-3 px-2">{y.customer_count?.toLocaleString()}</td>
              ))}
            </tr>
            <tr className="border-b border-white/10">
              <td className="py-3 px-2">Runway (months)</td>
              {currentScenario.years.map((y, idx) => (
                <td key={idx} className={`text-right py-3 px-2 ${y.runway_months < 6 ? 'text-red-400' : y.runway_months < 12 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {y.runway_months?.toFixed(0)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </GlassCard>

      <div className="flex justify-end">
        <Button
          onClick={onGenerate}
          variant="outline"
          className="border-white/10"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Regenerate
        </Button>
      </div>
    </div>
  );
}

function HealthCard({ title, value, health, description, icon: Icon, positive }) {
  const colors = {
    excellent: 'from-emerald-500/20 to-teal-600/20 border-emerald-500/30',
    good: 'from-blue-500/20 to-cyan-600/20 border-blue-500/30',
    warning: 'from-amber-500/20 to-orange-600/20 border-amber-500/30',
    critical: 'from-red-500/20 to-rose-600/20 border-red-500/30',
  };

  const iconColors = {
    excellent: 'text-emerald-400',
    good: 'text-blue-400',
    warning: 'text-amber-400',
    critical: 'text-red-400',
  };

  return (
    <GlassCard className={`p-4 bg-gradient-to-br ${colors[health]} border`}>
      <div className="flex items-center gap-3 mb-2">
        <Icon className={`w-5 h-5 ${iconColors[health]}`} />
        <span className="text-sm text-zinc-400">{title}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-zinc-500 mt-1">{description}</p>
    </GlassCard>
  );
}

function MetricCard({ label, value, icon: Icon, gradient }) {
  return (
    <GlassCard className={`p-4 bg-gradient-to-br ${gradient}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-white/70" />
        <span className="text-xs text-zinc-400">{label}</span>
      </div>
      <p className="text-xl font-bold">{value}</p>
    </GlassCard>
  );
}