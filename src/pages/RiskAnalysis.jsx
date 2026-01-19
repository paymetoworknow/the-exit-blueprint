import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Shield, AlertTriangle, AlertCircle, CheckCircle, RefreshCw,
  Loader2, TrendingDown, DollarSign, Users, FileText, Zap, Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';
import StageHeader from '@/components/ui/StageHeader';

const riskSeverity = {
  critical: { label: 'Critical', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: AlertCircle },
  high: { label: 'High', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: AlertTriangle },
  medium: { label: 'Medium', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: AlertTriangle },
  low: { label: 'Low', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: AlertCircle },
};

const riskCategories = [
  { id: 'business', label: 'Business Model', icon: Target, color: 'from-violet-500 to-purple-600' },
  { id: 'market', label: 'Market Position', icon: TrendingDown, color: 'from-blue-500 to-cyan-500' },
  { id: 'financial', label: 'Financial Health', icon: DollarSign, color: 'from-amber-500 to-orange-500' },
  { id: 'operational', label: 'Operations', icon: Zap, color: 'from-emerald-500 to-teal-500' },
  { id: 'crm', label: 'Sales Pipeline', icon: Users, color: 'from-pink-500 to-rose-500' },
  { id: 'compliance', label: 'Compliance & Legal', icon: FileText, color: 'from-indigo-500 to-purple-500' },
];

export default function RiskAnalysis() {
  const queryClient = useQueryClient();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [riskReport, setRiskReport] = useState(null);

  const { data: businesses } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => base44.entities.BusinessCore.list('-created_date', 1),
  });

  const { data: marketData } = useQuery({
    queryKey: ['market-analysis'],
    queryFn: () => base44.entities.MarketAnalysis.list('-created_date', 1),
  });

  const { data: financials } = useQuery({
    queryKey: ['financials'],
    queryFn: () => base44.entities.Financials.list('-created_date', 1),
  });

  const { data: brandAssets } = useQuery({
    queryKey: ['brand-assets'],
    queryFn: () => base44.entities.BrandAssets.list('-created_date', 1),
  });

  const { data: leads } = useQuery({
    queryKey: ['crm-leads'],
    queryFn: () => base44.entities.CRMLead.list(),
  });

  const { data: documents } = useQuery({
    queryKey: ['due-diligence'],
    queryFn: () => base44.entities.DueDiligence.list(),
  });

  const currentBusiness = businesses?.[0];
  const currentMarket = marketData?.[0];
  const currentFinancials = financials?.[0];
  const currentBrand = brandAssets?.[0];

  const analyzeRisksMutation = useMutation({
    mutationFn: async () => {
      setIsAnalyzing(true);

      const prompt = `Conduct a comprehensive risk analysis for this business across all operational areas:

BUSINESS DATA:
- Name: ${currentBusiness?.business_name}
- Industry: ${currentBusiness?.industry}
- Business Model: ${currentBusiness?.business_model}
- Current Stage: ${currentBusiness?.current_stage}/5
- Confidence Score: ${currentBusiness?.confidence_score}%
- Problem: ${currentBusiness?.problem_statement}
- Solution: ${currentBusiness?.solution}

MARKET ANALYSIS:
- TAM: $${currentMarket?.tam || 0}
- SAM: $${currentMarket?.sam || 0}
- SOM: $${currentMarket?.som || 0}
- Market Growth Rate: ${currentMarket?.market_growth_rate || 0}%
- Competitors: ${currentMarket?.competitors?.length || 0} analyzed
- Market Confidence: ${currentMarket?.market_confidence || 0}%

FINANCIALS:
- Monthly Revenue: $${currentFinancials?.monthly_revenue || 0}
- Annual Revenue: $${currentFinancials?.annual_revenue || 0}
- Monthly Burn: $${currentFinancials?.monthly_burn || 0}
- Runway: ${currentFinancials?.runway_months || 0} months
- Cash on Hand: $${currentFinancials?.cash_on_hand || 0}
- CAC: $${currentFinancials?.cac || 0}
- LTV: $${currentFinancials?.ltv || 0}
- LTV/CAC Ratio: ${currentFinancials?.ltv_cac_ratio || 0}
- Gross Margin: ${currentFinancials?.gross_margin || 0}%
- Churn Rate: ${currentFinancials?.churn_rate || 0}%
- Valuation: $${currentFinancials?.valuation || 0}

BRAND & OPERATIONS:
- Brand Assets Developed: ${currentBrand ? 'Yes' : 'No'}
- Marketing Copy: ${currentBrand?.marketing_copy ? 'Complete' : 'Incomplete'}
- SOPs Defined: ${currentBrand?.sop_list?.length || 0} procedures

CRM & SALES:
- Total Leads: ${leads?.length || 0}
- Investor Leads: ${leads?.filter(l => l.lead_type === 'investor').length || 0}
- Customer Leads: ${leads?.filter(l => l.lead_type === 'customer').length || 0}
- Pipeline Status Distribution: ${JSON.stringify(leads?.reduce((acc, l) => { acc[l.status] = (acc[l.status] || 0) + 1; return acc; }, {}))}

DUE DILIGENCE:
- Documents Uploaded: ${documents?.length || 0}
- Flagged Documents: ${documents?.filter(d => d.status === 'flagged').length || 0}
- Verified Documents: ${documents?.filter(d => d.status === 'verified').length || 0}

Identify risks, inconsistencies, and red flags across ALL categories:
1. Business Model Risks (viability, scalability, market fit)
2. Market Position Risks (competition, market size inconsistencies, positioning)
3. Financial Risks (burn rate, runway, unit economics, valuation concerns)
4. Operational Risks (missing processes, brand inconsistencies, execution gaps)
5. CRM/Sales Risks (pipeline health, conversion issues, lead quality)
6. Compliance/Legal Risks (missing documents, flagged items, regulatory concerns)

For each risk identified:
- Provide severity level (critical/high/medium/low)
- Explain the specific issue and why it matters
- Suggest 2-3 concrete mitigation strategies
- Estimate impact if left unaddressed

Also provide:
- Overall risk score (0-100, higher = more risk)
- Top 3 priority actions
- Positive observations (strengths to leverage)`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            overall_risk_score: { type: "number" },
            summary: { type: "string" },
            top_priorities: { type: "array", items: { type: "string" } },
            positive_observations: { type: "array", items: { type: "string" } },
            risks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  severity: { type: "string" },
                  impact: { type: "string" },
                  mitigation_strategies: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      return result;
    },
    onSuccess: (data) => {
      setRiskReport(data);
      setIsAnalyzing(false);
    },
    onError: () => setIsAnalyzing(false),
  });

  const handleAnalyze = () => {
    if (currentBusiness) {
      analyzeRisksMutation.mutate();
    }
  };

  const getRisksByCategory = (category) => {
    return riskReport?.risks?.filter(r => r.category === category) || [];
  };

  const getRiskCountByCategory = (category) => {
    return getRisksByCategory(category).length;
  };

  const criticalRisks = riskReport?.risks?.filter(r => r.severity === 'critical') || [];
  const highRisks = riskReport?.risks?.filter(r => r.severity === 'high') || [];

  return (
    <div className="max-w-7xl mx-auto">
      <StageHeader
        stageNumber="AI"
        title="Risk Analysis"
        subtitle="AI-powered risk detection and mitigation across all stages"
        icon={Shield}
        gradient="from-red-500 to-rose-600"
      >
        <Button
          onClick={handleAnalyze}
          disabled={!currentBusiness || isAnalyzing}
          className="bg-gradient-to-r from-red-500 to-rose-600"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Run Analysis
            </>
          )}
        </Button>
      </StageHeader>

      {!riskReport && !isAnalyzing && (
        <GlassCard className="p-12 text-center">
          <Shield className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Comprehensive Risk Assessment</h3>
          <p className="text-zinc-500 max-w-2xl mx-auto mb-6">
            AI will analyze your entire business across all stages to identify risks, inconsistencies, and red flags
            with actionable mitigation strategies.
          </p>
          <Button
            onClick={handleAnalyze}
            disabled={!currentBusiness}
            className="bg-gradient-to-r from-red-500 to-rose-600"
          >
            <Shield className="w-4 h-4 mr-2" />
            Start Risk Analysis
          </Button>
        </GlassCard>
      )}

      {isAnalyzing && (
        <GlassCard className="p-12 text-center">
          <Loader2 className="w-16 h-16 text-violet-500 mx-auto mb-4 animate-spin" />
          <h3 className="text-xl font-semibold mb-2">Analyzing Your Business...</h3>
          <p className="text-zinc-500">
            AI is scanning all stages for risks, inconsistencies, and opportunities
          </p>
        </GlassCard>
      )}

      {riskReport && (
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid lg:grid-cols-4 gap-6">
            <GlassCard className="p-6 bg-gradient-to-br from-red-500/10 to-rose-600/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-400 uppercase tracking-wider">Risk Score</span>
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <p className="text-3xl font-bold">{riskReport.overall_risk_score}/100</p>
              <p className="text-xs text-zinc-500 mt-1">
                {riskReport.overall_risk_score < 30 ? 'Low Risk' : 
                 riskReport.overall_risk_score < 60 ? 'Moderate Risk' : 'High Risk'}
              </p>
            </GlassCard>

            <GlassCard className="p-6 bg-gradient-to-br from-orange-500/10 to-red-600/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-400 uppercase tracking-wider">Critical Issues</span>
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <p className="text-3xl font-bold">{criticalRisks.length}</p>
              <p className="text-xs text-zinc-500 mt-1">Immediate attention required</p>
            </GlassCard>

            <GlassCard className="p-6 bg-gradient-to-br from-amber-500/10 to-orange-600/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-400 uppercase tracking-wider">High Priority</span>
                <AlertTriangle className="w-5 h-5 text-orange-400" />
              </div>
              <p className="text-3xl font-bold">{highRisks.length}</p>
              <p className="text-xs text-zinc-500 mt-1">Address soon</p>
            </GlassCard>

            <GlassCard className="p-6 bg-gradient-to-br from-emerald-500/10 to-teal-600/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-400 uppercase tracking-wider">Total Risks</span>
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-3xl font-bold">{riskReport.risks?.length || 0}</p>
              <p className="text-xs text-zinc-500 mt-1">Identified issues</p>
            </GlassCard>
          </div>

          {/* Summary & Priorities */}
          <div className="grid lg:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Top Priority Actions
              </h3>
              <div className="space-y-3">
                {riskReport.top_priorities?.map((priority, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-sm font-bold text-red-400 shrink-0">
                      {idx + 1}
                    </div>
                    <p className="text-sm text-zinc-300">{priority}</p>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                Strengths to Leverage
              </h3>
              <div className="space-y-3">
                {riskReport.positive_observations?.map((obs, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-zinc-300">{obs}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Risk Categories */}
          <div className="grid lg:grid-cols-2 gap-6">
            {riskCategories.map((category) => {
              const risks = getRisksByCategory(category.id);
              if (risks.length === 0) return null;

              const Icon = category.icon;
              return (
                <GlassCard key={category.id} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold">{category.label}</h3>
                    </div>
                    <Badge variant="outline" className="border-white/10">
                      {risks.length} {risks.length === 1 ? 'Risk' : 'Risks'}
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    {risks.map((risk, idx) => {
                      const severityConfig = riskSeverity[risk.severity] || riskSeverity.medium;
                      const SeverityIcon = severityConfig.icon;

                      return (
                        <div key={idx} className="p-4 rounded-lg bg-white/5 border border-white/5">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h4 className="font-medium text-sm">{risk.title}</h4>
                            <Badge className={severityConfig.color} variant="outline">
                              <SeverityIcon className="w-3 h-3 mr-1" />
                              {severityConfig.label}
                            </Badge>
                          </div>
                          
                          <p className="text-xs text-zinc-400 mb-3">{risk.description}</p>
                          
                          {risk.impact && (
                            <div className="mb-3 p-2 rounded bg-red-500/10 border border-red-500/20">
                              <p className="text-xs text-red-400">
                                <strong>Impact:</strong> {risk.impact}
                              </p>
                            </div>
                          )}

                          <div>
                            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Mitigation Strategies:</p>
                            <ul className="space-y-1">
                              {risk.mitigation_strategies?.map((strategy, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                                  <span className="text-emerald-400 shrink-0">•</span>
                                  <span>{strategy}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}