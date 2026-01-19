import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Link2, Sparkles, Loader2, CheckCircle, RefreshCw,
  TrendingUp, Users, DollarSign, Target, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';
import StageHeader from '@/components/ui/StageHeader';

export default function CRMIntegration() {
  const queryClient = useQueryClient();
  const [analyzingData, setAnalyzingData] = useState(false);
  const [insights, setInsights] = useState(null);

  const { data: businesses } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => base44.entities.BusinessCore.list('-created_date', 1),
  });

  const { data: leads } = useQuery({
    queryKey: ['crm-leads'],
    queryFn: () => base44.entities.CRMLead.list('-created_date'),
  });

  const currentBusiness = businesses?.[0];
  const businessLeads = leads?.filter(l => l.business_id === currentBusiness?.id) || [];

  const syncSalesforceMutation = useMutation({
    mutationFn: () => base44.functions.invoke('syncSalesforceCRM', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
    }
  });

  const syncHubSpotMutation = useMutation({
    mutationFn: () => base44.functions.invoke('syncHubSpotCRM', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
    }
  });

  const analyzeLeads = async () => {
    setAnalyzingData(true);
    try {
      const prompt = `Analyze this CRM data for ${currentBusiness?.business_name}:

Total Leads: ${businessLeads.length}

Lead Breakdown:
${JSON.stringify(businessLeads.map(l => ({
  name: l.name,
  company: l.company,
  type: l.lead_type,
  status: l.status,
  deal_size: l.deal_size,
  last_contact: l.last_contact
})))}

Provide comprehensive analysis:
1. Sales Performance Summary (conversion rates, win rate, pipeline health)
2. Lead Quality Assessment (lead scoring insights, best performing lead sources)
3. Customer Segmentation (by industry, deal size, status)
4. Revenue Insights (total pipeline value, average deal size, forecasted revenue)
5. Actionable Recommendations (top 5 priorities to improve sales)`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            sales_performance: {
              type: "object",
              properties: {
                conversion_rate: { type: "number" },
                win_rate: { type: "number" },
                pipeline_health_score: { type: "number" },
                summary: { type: "string" }
              }
            },
            lead_quality: {
              type: "object",
              properties: {
                average_quality_score: { type: "number" },
                top_lead_sources: { type: "array", items: { type: "string" } },
                insights: { type: "string" }
              }
            },
            customer_segments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  segment_name: { type: "string" },
                  count: { type: "number" },
                  avg_deal_size: { type: "number" }
                }
              }
            },
            revenue_insights: {
              type: "object",
              properties: {
                total_pipeline_value: { type: "number" },
                average_deal_size: { type: "number" },
                forecasted_revenue: { type: "number" },
                analysis: { type: "string" }
              }
            },
            recommendations: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setInsights(result);
    } catch (error) {
      console.error('Analysis failed:', error);
    }
    setAnalyzingData(false);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <StageHeader
        stageNumber="CRM"
        title="CRM Integration & Insights"
        subtitle="Sync and analyze sales data from Salesforce and HubSpot"
        icon={Link2}
        gradient="from-blue-500 to-cyan-600"
      />

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Salesforce Integration */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Link2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Salesforce</h3>
              <p className="text-sm text-zinc-400">Sync leads and opportunities</p>
            </div>
          </div>
          <Button
            onClick={() => syncSalesforceMutation.mutate()}
            disabled={syncSalesforceMutation.isPending}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600"
          >
            {syncSalesforceMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Sync Salesforce Data
          </Button>
          {syncSalesforceMutation.isSuccess && (
            <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <p className="text-sm text-emerald-400">
                Synced {syncSalesforceMutation.data?.data?.total_synced || 0} records
              </p>
            </div>
          )}
        </GlassCard>

        {/* HubSpot Integration */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Link2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">HubSpot</h3>
              <p className="text-sm text-zinc-400">Sync contacts and deals</p>
            </div>
          </div>
          <Button
            onClick={() => syncHubSpotMutation.mutate()}
            disabled={syncHubSpotMutation.isPending}
            className="w-full bg-gradient-to-r from-orange-500 to-red-600"
          >
            {syncHubSpotMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Sync HubSpot Data
          </Button>
          {syncHubSpotMutation.isSuccess && (
            <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <p className="text-sm text-emerald-400">
                Synced {syncHubSpotMutation.data?.data?.total_synced || 0} records
              </p>
            </div>
          )}
        </GlassCard>
      </div>

      {/* CRM Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <GlassCard className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{businessLeads.length}</p>
              <p className="text-xs text-zinc-500">Total Leads</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {businessLeads.filter(l => l.status === 'closed_won').length}
              </p>
              <p className="text-xs text-zinc-500">Closed Won</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {businessLeads.filter(l => ['meeting', 'negotiating'].includes(l.status)).length}
              </p>
              <p className="text-xs text-zinc-500">Active Pipeline</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                ${(businessLeads.reduce((sum, l) => sum + (l.deal_size || 0), 0) / 1000).toFixed(0)}k
              </p>
              <p className="text-xs text-zinc-500">Pipeline Value</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* AI Analysis */}
      <GlassCard className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">AI Sales Insights</h3>
            <p className="text-sm text-zinc-400">Comprehensive CRM data analysis</p>
          </div>
          <Button
            onClick={analyzeLeads}
            disabled={analyzingData || businessLeads.length === 0}
            className="bg-gradient-to-r from-violet-500 to-purple-600"
          >
            {analyzingData ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Analyze CRM Data
          </Button>
        </div>

        {insights && (
          <div className="grid lg:grid-cols-2 gap-6 mt-6">
            {/* Sales Performance */}
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Sales Performance
              </h4>
              <div className="space-y-2 mb-3">
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-400">Conversion Rate</span>
                  <span className="font-semibold">{insights.sales_performance?.conversion_rate?.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-400">Win Rate</span>
                  <span className="font-semibold">{insights.sales_performance?.win_rate?.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-400">Pipeline Health</span>
                  <Badge className="bg-emerald-500/20 text-emerald-400">
                    {insights.sales_performance?.pipeline_health_score?.toFixed(0)}/100
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-zinc-300">{insights.sales_performance?.summary}</p>
            </div>

            {/* Lead Quality */}
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-400" />
                Lead Quality
              </h4>
              <div className="mb-3">
                <span className="text-sm text-zinc-400">Quality Score</span>
                <p className="text-2xl font-bold text-blue-400">
                  {insights.lead_quality?.average_quality_score?.toFixed(0)}/100
                </p>
              </div>
              <p className="text-xs text-zinc-500 mb-2">Top Lead Sources:</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {insights.lead_quality?.top_lead_sources?.map((source, idx) => (
                  <Badge key={idx} variant="outline" className="border-blue-500/20 text-blue-400">
                    {source}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-zinc-300">{insights.lead_quality?.insights}</p>
            </div>

            {/* Revenue Insights */}
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-violet-400" />
                Revenue Insights
              </h4>
              <div className="space-y-2 mb-3">
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-400">Pipeline Value</span>
                  <span className="font-semibold">
                    ${(insights.revenue_insights?.total_pipeline_value / 1000).toFixed(0)}k
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-400">Avg Deal Size</span>
                  <span className="font-semibold">
                    ${(insights.revenue_insights?.average_deal_size / 1000).toFixed(1)}k
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-400">Forecast</span>
                  <span className="font-semibold text-violet-400">
                    ${(insights.revenue_insights?.forecasted_revenue / 1000).toFixed(0)}k
                  </span>
                </div>
              </div>
              <p className="text-sm text-zinc-300">{insights.revenue_insights?.analysis}</p>
            </div>

            {/* Customer Segments */}
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                Customer Segments
              </h4>
              <div className="space-y-2">
                {insights.customer_segments?.map((segment, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">{segment.segment_name}</p>
                      <p className="text-xs text-zinc-500">{segment.count} leads</p>
                    </div>
                    <span className="text-sm font-semibold text-amber-400">
                      ${(segment.avg_deal_size / 1000).toFixed(1)}k avg
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="lg:col-span-2 p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-600/10 border border-purple-500/20">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-purple-400" />
                Actionable Recommendations
              </h4>
              <ul className="space-y-2">
                {insights.recommendations?.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-zinc-300">
                    <CheckCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {!insights && !analyzingData && businessLeads.length === 0 && (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-500">Sync CRM data to generate AI insights</p>
          </div>
        )}
      </GlassCard>
    </div>
  );
}