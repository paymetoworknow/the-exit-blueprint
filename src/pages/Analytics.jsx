import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, Download, Users, DollarSign, 
  Target, Briefcase, Shield, EyeOff, Loader2, Award, Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import GlassCard from '@/components/ui/GlassCard';

const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

export default function Analytics() {
  const [visibleWidgets, setVisibleWidgets] = useState({
    overview: true,
    financial: true,
    crm: true,
    market: true,
    brand: true,
    dueDiligence: true,
    timeline: true,
  });

  // Fetch all data
  const { data: businesses, isLoading: loadingBusiness } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => base44.entities.BusinessCore.list('-created_date', 1),
  });

  const { data: financials, isLoading: loadingFinancials } = useQuery({
    queryKey: ['financials'],
    queryFn: () => base44.entities.Financials.list('-created_date', 1),
  });

  const { data: market, isLoading: loadingMarket } = useQuery({
    queryKey: ['market-analysis'],
    queryFn: () => base44.entities.MarketAnalysis.list('-created_date', 1),
  });

  const { data: brand, isLoading: loadingBrand } = useQuery({
    queryKey: ['brand-assets'],
    queryFn: () => base44.entities.BrandAssets.list('-created_date', 1),
  });

  const { data: leads, isLoading: loadingLeads } = useQuery({
    queryKey: ['crm-leads'],
    queryFn: () => base44.entities.CRMLead.list('-created_date', 100),
  });

  const { data: documents, isLoading: loadingDocs } = useQuery({
    queryKey: ['due-diligence'],
    queryFn: () => base44.entities.DueDiligence.list('-created_date', 100),
  });

  const { data: pitchDecks } = useQuery({
    queryKey: ['pitch-decks'],
    queryFn: () => base44.entities.PitchDeck.list('-created_date', 1),
  });

  const currentBusiness = businesses?.[0];
  const currentFinancials = financials?.[0];
  const currentMarket = market?.[0];
  const currentBrand = brand?.[0];
  const currentDeck = pitchDecks?.[0];

  // Analytics calculations
  const analytics = useMemo(() => {
    if (!currentBusiness) return null;

    // Stage completion
    const stageCompletion = currentBusiness.stage_completion || {};
    const completedStages = Object.values(stageCompletion).filter(Boolean).length;

    // CRM analytics
    const totalLeads = leads?.length || 0;
    const investorLeads = leads?.filter(l => l.lead_type === 'investor').length || 0;
    const customerLeads = leads?.filter(l => l.lead_type === 'customer').length || 0;
    const pipelineValue = leads?.reduce((sum, l) => sum + (l.deal_size || 0), 0) || 0;
    const closedWon = leads?.filter(l => l.status === 'closed_won').length || 0;
    const conversionRate = totalLeads > 0 ? (closedWon / totalLeads) * 100 : 0;

    // Lead status breakdown
    const leadsByStatus = leads?.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {}) || {};

    // Financial health
    const runway = currentFinancials?.runway_months || 0;
    const ltvCac = currentFinancials?.ltv_cac_ratio || 0;
    const monthlyRevenue = currentFinancials?.monthly_revenue || 0;
    const annualRevenue = currentFinancials?.annual_revenue || 0;
    const valuation = currentFinancials?.valuation || 0;

    // Due diligence progress
    const totalDocs = documents?.length || 0;
    const verifiedDocs = documents?.filter(d => d.status === 'verified').length || 0;
    const ddProgress = totalDocs > 0 ? (verifiedDocs / totalDocs) * 100 : 0;

    // Market positioning
    const tam = currentMarket?.tam || 0;
    const som = currentMarket?.som || 0;
    const marketShare = tam > 0 && annualRevenue > 0 ? (annualRevenue / tam) * 100 : 0;

    // Brand completeness
    const brandScore = calculateBrandScore(currentBrand);

    return {
      completedStages,
      totalLeads,
      investorLeads,
      customerLeads,
      pipelineValue,
      conversionRate,
      leadsByStatus,
      runway,
      ltvCac,
      monthlyRevenue,
      annualRevenue,
      valuation,
      totalDocs,
      verifiedDocs,
      ddProgress,
      tam,
      som,
      marketShare,
      brandScore,
      confidenceScore: currentBusiness.confidence_score || 0,
      marketConfidence: currentMarket?.market_confidence || 0,
    };
  }, [currentBusiness, currentFinancials, currentMarket, currentBrand, leads, documents]);

  const handleExport = async () => {
    const exportData = {
      business: currentBusiness,
      financials: currentFinancials,
      market: currentMarket,
      brand: currentBrand,
      leads: leads,
      analytics: analytics,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentBusiness?.business_name || 'business'}-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleWidget = (widget) => {
    setVisibleWidgets(prev => ({ ...prev, [widget]: !prev[widget] }));
  };

  if (loadingBusiness || !currentBusiness) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  const formatCurrency = (num) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
    return `$${num.toFixed(0)}`;
  };

  const statusChartData = Object.entries(analytics.leadsByStatus).map(([status, count]) => ({
    name: status.replace(/_/g, ' '),
    value: count,
  }));

  const progressData = [
    { stage: 'Stage 1', completion: currentBusiness.stage_completion?.stage1 ? 100 : 0 },
    { stage: 'Stage 2', completion: currentBusiness.stage_completion?.stage2 ? 100 : 0 },
    { stage: 'Stage 3', completion: currentBusiness.stage_completion?.stage3 ? 100 : 0 },
    { stage: 'Stage 4', completion: currentBusiness.stage_completion?.stage4 ? 100 : 0 },
    { stage: 'Stage 5', completion: currentBusiness.stage_completion?.stage5 ? 100 : 0 },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Analytics Dashboard</h1>
          <p className="text-zinc-400">Comprehensive insights across your exit journey</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleExport}
            variant="outline"
            className="border-white/10"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      {visibleWidgets.overview && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <StatCard
            label="Stages Complete"
            value={`${analytics.completedStages}/5`}
            icon={Award}
            color="violet"
          />
          <StatCard
            label="Confidence Score"
            value={`${analytics.confidenceScore.toFixed(0)}%`}
            icon={Target}
            color="blue"
          />
          <StatCard
            label="Valuation"
            value={formatCurrency(analytics.valuation)}
            icon={DollarSign}
            color="emerald"
          />
          <StatCard
            label="Total Leads"
            value={analytics.totalLeads}
            icon={Users}
            color="amber"
          />
          <StatCard
            label="Pipeline Value"
            value={formatCurrency(analytics.pipelineValue)}
            icon={Briefcase}
            color="rose"
          />
        </div>
      )}

      {/* Financial Overview */}
      {visibleWidgets.financial && (
        <GlassCard className="p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              Financial Performance
            </h3>
            <Button variant="ghost" size="icon" onClick={() => toggleWidget('financial')}>
              <EyeOff className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              label="Monthly Revenue"
              value={formatCurrency(analytics.monthlyRevenue)}
              change="+12%"
            />
            <MetricCard
              label="Annual Revenue"
              value={formatCurrency(analytics.annualRevenue)}
            />
            <MetricCard
              label="LTV/CAC Ratio"
              value={analytics.ltvCac.toFixed(2)}
              change={analytics.ltvCac >= 3 ? "Excellent" : "Good"}
            />
            <MetricCard
              label="Runway"
              value={`${analytics.runway} mo`}
              change={analytics.runway >= 12 ? "Healthy" : "Warning"}
            />
          </div>
        </GlassCard>
      )}

      {/* CRM & Pipeline */}
      {visibleWidgets.crm && (
        <GlassCard className="p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              CRM & Pipeline Analytics
            </h3>
            <Button variant="ghost" size="icon" onClick={() => toggleWidget('crm')}>
              <EyeOff className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-xs text-zinc-500 mb-1">Investors</p>
                  <p className="text-2xl font-bold">{analytics.investorLeads}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-xs text-zinc-500 mb-1">Customers</p>
                  <p className="text-2xl font-bold">{analytics.customerLeads}</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-600/10 border border-blue-500/20">
                <p className="text-xs text-blue-400 mb-1">Conversion Rate</p>
                <p className="text-3xl font-bold">{analytics.conversionRate.toFixed(1)}%</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-zinc-400 mb-3">Pipeline Distribution</p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Market & Competition */}
      {visibleWidgets.market && (
        <GlassCard className="p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Target className="w-5 h-5 text-violet-400" />
              Market Position
            </h3>
            <Button variant="ghost" size="icon" onClick={() => toggleWidget('market')}>
              <EyeOff className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div className="p-4 rounded-xl bg-white/5">
              <p className="text-xs text-zinc-500 mb-1">TAM</p>
              <p className="text-xl font-bold">{formatCurrency(analytics.tam)}</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5">
              <p className="text-xs text-zinc-500 mb-1">SOM Target</p>
              <p className="text-xl font-bold">{formatCurrency(analytics.som)}</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-600/10 border border-violet-500/20">
              <p className="text-xs text-violet-400 mb-1">Market Share</p>
              <p className="text-xl font-bold">{analytics.marketShare.toFixed(3)}%</p>
            </div>
          </div>
          <div className="mt-6">
            <p className="text-sm text-zinc-400 mb-3">Market Confidence: {analytics.marketConfidence}%</p>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all"
                style={{ width: `${analytics.marketConfidence}%` }}
              />
            </div>
          </div>
        </GlassCard>
      )}

      {/* Brand Health */}
      {visibleWidgets.brand && currentBrand && (
        <GlassCard className="p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-400" />
              Brand Completeness
            </h3>
            <Button variant="ghost" size="icon" onClick={() => toggleWidget('brand')}>
              <EyeOff className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <BrandMetric label="Color Palette" complete={!!currentBrand.primary_color} />
            <BrandMetric label="Typography" complete={!!currentBrand.heading_font} />
            <BrandMetric label="Logo" complete={!!currentBrand.logo_url} />
            <BrandMetric label="Marketing Copy" complete={!!currentBrand.marketing_copy} />
          </div>
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500/20">
            <p className="text-xs text-amber-400 mb-1">Overall Brand Score</p>
            <p className="text-2xl font-bold">{analytics.brandScore}%</p>
          </div>
        </GlassCard>
      )}

      {/* Due Diligence Progress */}
      {visibleWidgets.dueDiligence && (
        <GlassCard className="p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5 text-rose-400" />
              Due Diligence Status
            </h3>
            <Button variant="ghost" size="icon" onClick={() => toggleWidget('dueDiligence')}>
              <EyeOff className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="p-4 rounded-xl bg-white/5">
              <p className="text-xs text-zinc-500 mb-1">Total Documents</p>
              <p className="text-2xl font-bold">{analytics.totalDocs}</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5">
              <p className="text-xs text-zinc-500 mb-1">Verified</p>
              <p className="text-2xl font-bold text-emerald-400">{analytics.verifiedDocs}</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-rose-500/10 to-pink-600/10 border border-rose-500/20">
              <p className="text-xs text-rose-400 mb-1">Completion</p>
              <p className="text-2xl font-bold">{analytics.ddProgress.toFixed(0)}%</p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Timeline Progress */}
      {visibleWidgets.timeline && (
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Journey Progress
            </h3>
            <Button variant="ghost" size="icon" onClick={() => toggleWidget('timeline')}>
              <EyeOff className="w-4 h-4" />
            </Button>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="stage" stroke="#71717A" />
              <YAxis stroke="#71717A" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              />
              <Bar dataKey="completion" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      )}
    </div>
  );
}

function calculateBrandScore(brand) {
  if (!brand) return 0;
  let score = 0;
  if (brand.primary_color) score += 20;
  if (brand.heading_font) score += 20;
  if (brand.logo_url) score += 30;
  if (brand.marketing_copy) score += 30;
  return score;
}

function StatCard({ label, value, icon: Icon, color }) {
  const colorClasses = {
    violet: 'from-violet-500/20 to-purple-600/20 border-violet-500/30',
    blue: 'from-blue-500/20 to-cyan-600/20 border-blue-500/30',
    emerald: 'from-emerald-500/20 to-teal-600/20 border-emerald-500/30',
    amber: 'from-amber-500/20 to-orange-600/20 border-amber-500/30',
    rose: 'from-rose-500/20 to-pink-600/20 border-rose-500/30',
  };

  return (
    <GlassCard className={`p-4 bg-gradient-to-br ${colorClasses[color]} border`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-white/70" />
        <span className="text-xs text-zinc-400">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </GlassCard>
  );
}

function MetricCard({ label, value, change }) {
  return (
    <div>
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className="text-xl font-bold mb-1">{value}</p>
      {change && (
        <Badge variant="secondary" className="text-xs">
          {change}
        </Badge>
      )}
    </div>
  );
}

function BrandMetric({ label, complete }) {
  return (
    <div className="p-3 rounded-lg bg-white/5 border border-white/5">
      <p className="text-xs text-zinc-500 mb-2">{label}</p>
      {complete ? (
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
          ✓ Complete
        </Badge>
      ) : (
        <Badge variant="secondary" className="text-zinc-500">
          Pending
        </Badge>
      )}
    </div>
  );
}