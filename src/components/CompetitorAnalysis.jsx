import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Users, CheckCircle, AlertCircle } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

export default function CompetitorAnalysis({ currentBusiness, currentMarket }) {
  const queryClient = useQueryClient();
  const [competitorInput, setCompetitorInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeCompetitorsMutation = useMutation({
    mutationFn: async (competitorNames) => {
      setIsAnalyzing(true);

      const prompt = `Analyze the following competitors in the ${currentBusiness?.industry} industry:

Competitors: ${competitorNames}

For EACH competitor, provide detailed analysis:
1. Company overview and market position
2. Product/service offerings and key features
3. Pricing strategy and business model
4. Estimated annual revenue (use real data if publicly available)
5. Funding raised (use real data if publicly available)
6. Strengths and weaknesses (3-5 each)
7. Market share estimate (%)
8. Target customer segments
9. Competitive advantages
10. Recent news or developments

Use real-world data from the internet and current market intelligence.`;

      const result = await base44.integrations.Core.InvokeLLM({
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

      // Update market analysis with competitor data
      if (currentMarket) {
        await base44.entities.MarketAnalysis.update(currentMarket.id, {
          competitors: result.competitors
        });
      }

      return result;
    },
    onSuccess: () => {
      setIsAnalyzing(false);
      queryClient.invalidateQueries({ queryKey: ['market-analysis'] });
      setCompetitorInput('');
    },
    onError: () => setIsAnalyzing(false),
  });

  const handleAnalyze = () => {
    if (competitorInput.trim()) {
      analyzeCompetitorsMutation.mutate(competitorInput);
    }
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
          AI will research each competitor using web data to provide detailed market intelligence
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

                {competitor.strengths && competitor.strengths.length > 0 && (
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

                {competitor.weaknesses && competitor.weaknesses.length > 0 && (
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Weaknesses</p>
                    <ul className="space-y-1">
                      {competitor.weaknesses.slice(0, 3).map((weakness, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                          <AlertCircle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
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
            Add competitor names above to get AI-powered analysis of their market positioning, strengths, and weaknesses
          </p>
        </GlassCard>
      )}
    </div>
  );
}