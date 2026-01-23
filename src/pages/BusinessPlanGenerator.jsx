import React, { useState } from 'react';
import { entities, integrations } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { 
  FileText, Sparkles, Loader2, Download, CheckCircle,
  Building2, TrendingUp, Users, DollarSign, Target, Shield, Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';
import StageHeader from '@/components/ui/StageHeader';

export default function BusinessPlanGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [businessPlan, setBusinessPlan] = useState(null);

  const { data: businesses } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => entities.BusinessCore.list('-created_date', 1),
  });

  const { data: brandAssets } = useQuery({
    queryKey: ['brand-assets'],
    queryFn: () => entities.BrandAssets.list('-created_date', 1),
  });

  const { data: marketAnalysis } = useQuery({
    queryKey: ['market-analysis'],
    queryFn: () => entities.MarketAnalysis.list('-created_date', 1),
  });

  const { data: financials } = useQuery({
    queryKey: ['financials'],
    queryFn: () => entities.Financials.list('-created_date', 1),
  });

  const { data: pitchDecks } = useQuery({
    queryKey: ['pitch-decks'],
    queryFn: () => entities.PitchDeck.list('-created_date', 1),
  });

  const { data: dueDiligence } = useQuery({
    queryKey: ['due-diligence'],
    queryFn: () => entities.DueDiligence.list('-created_date'),
  });

  const currentBusiness = businesses?.[0];
  const currentBrand = brandAssets?.[0];
  const currentMarket = marketAnalysis?.[0];
  const currentFinancials = financials?.[0];

  const generateBusinessPlan = async () => {
    setIsGenerating(true);
    try {
      const prompt = `Generate a comprehensive, professional business plan for ${currentBusiness?.business_name}:

BUSINESS OVERVIEW:
Name: ${currentBusiness?.business_name}
Tagline: ${currentBusiness?.tagline}
Industry: ${currentBusiness?.industry}
Business Model: ${currentBusiness?.business_model}
Mission: ${currentBusiness?.mission}
Vision: ${currentBusiness?.vision}
Problem Statement: ${currentBusiness?.problem_statement}
Solution: ${currentBusiness?.solution}
Unique Value Proposition: ${currentBusiness?.unique_value_prop}
Target Customer: ${currentBusiness?.target_customer}

BRAND & POSITIONING:
Brand Voice: ${currentBrand?.brand_voice}
Primary Color: ${currentBrand?.primary_color}
Marketing Copy: ${JSON.stringify(currentBrand?.marketing_copy)}

MARKET ANALYSIS:
TAM: $${currentMarket?.tam}
SAM: $${currentMarket?.sam}
SOM: $${currentMarket?.som}
Market Growth Rate: ${currentMarket?.market_growth_rate}%
TAM Rationale: ${currentMarket?.tam_rationale}
SAM Rationale: ${currentMarket?.sam_rationale}
SOM Rationale: ${currentMarket?.som_rationale}
Competitors: ${JSON.stringify(currentMarket?.competitors)}
SWOT Analysis: ${JSON.stringify(currentMarket?.swot)}
Lean Canvas: ${JSON.stringify(currentMarket?.lean_canvas)}

FINANCIAL DATA:
Annual Revenue: $${currentFinancials?.annual_revenue || 0}
Monthly Revenue: $${currentFinancials?.monthly_revenue || 0}
Monthly Burn: $${currentFinancials?.monthly_burn || 0}
Cash on Hand: $${currentFinancials?.cash_on_hand || 0}
Customer Count: ${currentFinancials?.customer_count || 0}
CAC: $${currentFinancials?.cac || 0}
LTV: $${currentFinancials?.ltv || 0}
LTV/CAC Ratio: ${currentFinancials?.ltv_cac_ratio || 0}
Gross Margin: ${currentFinancials?.gross_margin}%
Churn Rate: ${currentFinancials?.churn_rate}%
Valuation: $${currentFinancials?.valuation || 0}
Funding Raised: $${currentFinancials?.funding_raised || 0}

Generate a COMPLETE, DETAILED business plan with these sections:

1. EXECUTIVE SUMMARY (500 words)
   - Business overview and mission
   - Problem and solution
   - Target market
   - Competitive advantage
   - Financial highlights
   - Funding ask (if applicable)

2. COMPANY DESCRIPTION (400 words)
   - Detailed company background
   - Legal structure and ownership
   - Location and facilities
   - Key milestones achieved
   - Current stage and future roadmap

3. MARKET ANALYSIS (600 words)
   - Industry overview and trends
   - Target market definition and size (TAM/SAM/SOM)
   - Customer segmentation and personas
   - Market needs and gaps
   - Growth potential

4. COMPETITIVE ANALYSIS (500 words)
   - Competitive landscape overview
   - Key competitors and their positioning
   - Competitive advantages and differentiators
   - Market positioning strategy
   - Barriers to entry

5. ORGANIZATION & MANAGEMENT (400 words)
   - Organizational structure
   - Management team and key personnel
   - Board of directors/advisors
   - Staffing plan
   - Key hiring needs

6. PRODUCTS & SERVICES (500 words)
   - Detailed product/service description
   - Features and benefits
   - Product lifecycle
   - Intellectual property
   - Future product roadmap

7. MARKETING & SALES STRATEGY (600 words)
   - Go-to-market strategy
   - Marketing channels and tactics
   - Sales process and strategy
   - Customer acquisition approach
   - Pricing strategy
   - Brand positioning

8. FINANCIAL PROJECTIONS (500 words)
   - Current financial position
   - Revenue model and unit economics
   - 5-year financial projections summary
   - Key financial metrics (LTV, CAC, margins)
   - Break-even analysis
   - Funding requirements and use of funds

9. RISK ANALYSIS (400 words)
   - Key business risks
   - Market risks
   - Financial risks
   - Mitigation strategies

10. APPENDIX (200 words)
    - Supporting documents overview
    - Key assumptions
    - Additional resources

Write in a professional, compelling tone. Use specific data points. Make it investor-ready.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            executive_summary: { type: "string" },
            company_description: { type: "string" },
            market_analysis: { type: "string" },
            competitive_analysis: { type: "string" },
            organization_management: { type: "string" },
            products_services: { type: "string" },
            marketing_sales_strategy: { type: "string" },
            financial_projections: { type: "string" },
            risk_analysis: { type: "string" },
            appendix: { type: "string" },
            document_title: { type: "string" },
            generation_date: { type: "string" }
          }
        }
      });

      setBusinessPlan({
        ...result,
        generation_date: new Date().toLocaleDateString(),
        business_name: currentBusiness?.business_name
      });
    } catch (error) {
      console.error('Business plan generation failed:', error);
      alert('Failed to generate business plan. Please try again.');
    }
    setIsGenerating(false);
  };

  const exportToPDF = async () => {
    if (!businessPlan) return;

    const sections = [
      { title: 'Executive Summary', content: businessPlan.executive_summary },
      { title: 'Company Description', content: businessPlan.company_description },
      { title: 'Market Analysis', content: businessPlan.market_analysis },
      { title: 'Competitive Analysis', content: businessPlan.competitive_analysis },
      { title: 'Organization & Management', content: businessPlan.organization_management },
      { title: 'Products & Services', content: businessPlan.products_services },
      { title: 'Marketing & Sales Strategy', content: businessPlan.marketing_sales_strategy },
      { title: 'Financial Projections', content: businessPlan.financial_projections },
      { title: 'Risk Analysis', content: businessPlan.risk_analysis },
      { title: 'Appendix', content: businessPlan.appendix },
    ];

    const fullText = `${businessPlan.document_title || 'Business Plan'}\n${businessPlan.business_name}\nGenerated: ${businessPlan.generation_date}\n\n${sections.map(s => `\n\n${s.title.toUpperCase()}\n${'='.repeat(50)}\n\n${s.content}`).join('\n')}`;

    // Create downloadable text file
    const blob = new Blob([fullText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentBusiness?.business_name}_Business_Plan_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  const sections = businessPlan ? [
    { title: 'Executive Summary', content: businessPlan.executive_summary, icon: Sparkles },
    { title: 'Company Description', content: businessPlan.company_description, icon: Building2 },
    { title: 'Market Analysis', content: businessPlan.market_analysis, icon: TrendingUp },
    { title: 'Competitive Analysis', content: businessPlan.competitive_analysis, icon: Target },
    { title: 'Organization & Management', content: businessPlan.organization_management, icon: Users },
    { title: 'Products & Services', content: businessPlan.products_services, icon: CheckCircle },
    { title: 'Marketing & Sales Strategy', content: businessPlan.marketing_sales_strategy, icon: Target },
    { title: 'Financial Projections', content: businessPlan.financial_projections, icon: DollarSign },
    { title: 'Risk Analysis', content: businessPlan.risk_analysis, icon: Shield },
    { title: 'Appendix', content: businessPlan.appendix, icon: FileText },
  ] : [];

  return (
    <div className="max-w-5xl mx-auto">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-content, .print-content * { visibility: visible; }
          .print-content { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .print-section { page-break-after: always; }
          .print-section:last-child { page-break-after: auto; }
        }
      `}</style>
      <StageHeader
        stageNumber="AI"
        title="Business Plan Generator"
        subtitle="Comprehensive AI-generated business plan from all your data"
        icon={FileText}
        gradient="from-indigo-500 to-blue-600"
      >
        {businessPlan && (
          <div className="flex gap-2">
            <Button
              onClick={() => window.print()}
              className="bg-white/10 hover:bg-white/20 border border-white/20"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button
              onClick={exportToPDF}
              className="bg-white/10 hover:bg-white/20 border border-white/20"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        )}
      </StageHeader>

      {!businessPlan && !isGenerating && (
        <GlassCard className="p-12 text-center">
          <FileText className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Generate Your Business Plan</h3>
          <p className="text-zinc-500 max-w-2xl mx-auto mb-6">
            AI will synthesize all your data from Ideation, Branding, Market Analysis, Financials, 
            and Risk Assessment to create a comprehensive, investor-ready business plan document.
          </p>

          {/* Data Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-zinc-500 mb-1">Business Core</p>
              <div className="flex items-center gap-2">
                {currentBusiness ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-zinc-600" />
                )}
                <span className="text-sm font-semibold">
                  {currentBusiness ? 'Complete' : 'Pending'}
                </span>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-zinc-500 mb-1">Brand Assets</p>
              <div className="flex items-center gap-2">
                {currentBrand ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-zinc-600" />
                )}
                <span className="text-sm font-semibold">
                  {currentBrand ? 'Complete' : 'Pending'}
                </span>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-zinc-500 mb-1">Market Analysis</p>
              <div className="flex items-center gap-2">
                {currentMarket ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-zinc-600" />
                )}
                <span className="text-sm font-semibold">
                  {currentMarket ? 'Complete' : 'Pending'}
                </span>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-zinc-500 mb-1">Financials</p>
              <div className="flex items-center gap-2">
                {currentFinancials ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-zinc-600" />
                )}
                <span className="text-sm font-semibold">
                  {currentFinancials ? 'Complete' : 'Pending'}
                </span>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-zinc-500 mb-1">Pitch Deck</p>
              <div className="flex items-center gap-2">
                {pitchDecks?.[0] ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-zinc-600" />
                )}
                <span className="text-sm font-semibold">
                  {pitchDecks?.[0] ? 'Complete' : 'Pending'}
                </span>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-zinc-500 mb-1">Documents</p>
              <div className="flex items-center gap-2">
                {dueDiligence?.length > 0 ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-zinc-600" />
                )}
                <span className="text-sm font-semibold">
                  {dueDiligence?.length || 0} docs
                </span>
              </div>
            </div>
          </div>

          <Button
            onClick={generateBusinessPlan}
            disabled={!currentBusiness}
            className="bg-gradient-to-r from-indigo-500 to-blue-600"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Business Plan
          </Button>
        </GlassCard>
      )}

      {isGenerating && (
        <GlassCard className="p-12 text-center">
          <Loader2 className="w-16 h-16 animate-spin text-indigo-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Generating Your Business Plan...</h3>
          <p className="text-zinc-500">
            AI is synthesizing data from all stages to create a comprehensive document
          </p>
        </GlassCard>
      )}

      {businessPlan && (
        <div className="space-y-6 print-content">
          {/* Header Card */}
          <GlassCard className="p-6 bg-gradient-to-br from-indigo-500/10 to-blue-600/10 border-indigo-500/20 print-section">
            <h2 className="text-2xl font-bold mb-1">{businessPlan.document_title}</h2>
            <p className="text-lg text-zinc-400 mb-2">{businessPlan.business_name}</p>
            <div className="flex items-center gap-4">
              <Badge className="bg-emerald-500/20 text-emerald-400">
                <CheckCircle className="w-3 h-3 mr-1" />
                Generated
              </Badge>
              <span className="text-sm text-zinc-500">
                {businessPlan.generation_date}
              </span>
            </div>
          </GlassCard>

          {/* Sections */}
          {sections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <GlassCard key={idx} className="p-6 print-section">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-600/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-semibold">{section.title}</h3>
                </div>
                <div className="prose prose-invert max-w-none">
                  <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {section.content}
                  </p>
                </div>
              </GlassCard>
            );
          })}

          {/* Export Button */}
          <div className="flex justify-center gap-3 no-print">
            <Button
              onClick={() => window.print()}
              className="bg-white/10 hover:bg-white/20 border border-white/20"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Business Plan
            </Button>
            <Button
              onClick={exportToPDF}
              className="bg-gradient-to-r from-indigo-500 to-blue-600"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Complete Business Plan
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}