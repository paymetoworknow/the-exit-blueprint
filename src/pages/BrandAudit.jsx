import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Palette, Sparkles, Loader2, AlertCircle, CheckCircle, RefreshCw, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';
import StageHeader from '@/components/ui/StageHeader';

export default function BrandAudit() {
  const queryClient = useQueryClient();
  const [isAuditing, setIsAuditing] = useState(false);

  const { data: businesses } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => base44.entities.BusinessCore.list('-created_date', 1),
  });

  const { data: brandAssets } = useQuery({
    queryKey: ['brand-assets'],
    queryFn: () => base44.entities.BrandAssets.list('-created_date', 1),
  });

  const { data: pitchDecks } = useQuery({
    queryKey: ['pitch-decks'],
    queryFn: () => base44.entities.PitchDeck.list('-created_date', 1),
  });

  const { data: audits } = useQuery({
    queryKey: ['brand-audits'],
    queryFn: () => base44.entities.BrandAudit.list('-created_date', 1),
  });

  const currentBusiness = businesses?.[0];
  const currentBrand = brandAssets?.[0];
  const currentDeck = pitchDecks?.[0];
  const latestAudit = audits?.[0];

  const runAuditMutation = useMutation({
    mutationFn: async () => {
      setIsAuditing(true);

      const prompt = `Perform a comprehensive brand consistency audit for ${currentBusiness.business_name}:

BRAND GUIDELINES:
Brand Voice: ${currentBrand?.brand_voice || 'Not defined'}
Primary Color: ${currentBrand?.primary_color || 'Not defined'}
Secondary Color: ${currentBrand?.secondary_color || 'Not defined'}
Accent Color: ${currentBrand?.accent_color || 'Not defined'}
Heading Font: ${currentBrand?.heading_font || 'Not defined'}
Body Font: ${currentBrand?.body_font || 'Not defined'}

MARKETING COPY TO AUDIT:
About Us: ${currentBrand?.marketing_copy?.about_us || 'N/A'}
Social Bio: ${currentBrand?.marketing_copy?.social_bio || 'N/A'}
Elevator Pitch: ${currentBrand?.marketing_copy?.elevator_pitch || 'N/A'}
Hero Headline: ${currentBrand?.marketing_copy?.hero_headline || 'N/A'}

PITCH DECK CONTENT:
${currentDeck?.slides?.map((s, i) => `Slide ${i + 1}: ${s.title}\nContent: ${s.content?.join(', ')}`).join('\n\n') || 'No pitch deck'}

Analyze for:
1. Brand Voice Consistency - Does all copy match the defined brand voice? Check tone, language, formality
2. Visual Consistency - Are colors used consistently? (Note: Can't see actual visuals but flag if colors mentioned don't match brand)
3. Messaging Consistency - Is the core value proposition consistent across all materials?
4. Terminology Consistency - Are key terms used consistently?

For EACH inconsistency found:
- Location (which asset/content)
- Issue description
- Severity (critical/high/medium/low)
- Specific suggestion to fix

Provide:
- Overall consistency score (0-100)
- Voice consistency breakdown
- Visual consistency notes
- List of all inconsistencies with actionable fixes`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            overall_score: { type: "number" },
            voice_consistency: {
              type: "object",
              properties: {
                score: { type: "number" },
                analysis: { type: "string" },
                issues: { type: "array", items: { type: "string" } }
              }
            },
            visual_consistency: {
              type: "object",
              properties: {
                score: { type: "number" },
                analysis: { type: "string" },
                color_usage: { type: "string" }
              }
            },
            inconsistencies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  location: { type: "string" },
                  issue: { type: "string" },
                  severity: { type: "string" },
                  suggestion: { type: "string" }
                }
              }
            }
          }
        }
      });

      await base44.entities.BrandAudit.create({
        business_id: currentBusiness.id,
        audit_date: new Date().toISOString(),
        overall_score: result.overall_score,
        voice_consistency: result.voice_consistency,
        visual_consistency: result.visual_consistency,
        inconsistencies: result.inconsistencies
      });

      return result;
    },
    onSuccess: () => {
      setIsAuditing(false);
      queryClient.invalidateQueries({ queryKey: ['brand-audits'] });
    },
    onError: () => setIsAuditing(false),
  });

  const severityColors = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };

  return (
    <div className="max-w-7xl mx-auto">
      <StageHeader
        stageNumber="AI"
        title="Brand Audit"
        subtitle="AI-powered brand consistency analysis across all assets"
        icon={Palette}
        gradient="from-pink-500 to-rose-600"
      >
        <Button
          onClick={() => runAuditMutation.mutate()}
          disabled={!currentBusiness || !currentBrand || isAuditing}
          className="bg-gradient-to-r from-pink-500 to-rose-600"
        >
          {isAuditing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Auditing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Run Brand Audit
            </>
          )}
        </Button>
      </StageHeader>

      {!latestAudit && !isAuditing && (
        <GlassCard className="p-12 text-center">
          <Palette className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Brand Audit Yet</h3>
          <p className="text-zinc-500 max-w-md mx-auto mb-6">
            AI will analyze all your brand assets for consistency in voice, visuals, and messaging
          </p>
          <Button
            onClick={() => runAuditMutation.mutate()}
            disabled={!currentBusiness || !currentBrand}
            className="bg-gradient-to-r from-pink-500 to-rose-600"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Run First Audit
          </Button>
        </GlassCard>
      )}

      {isAuditing && (
        <GlassCard className="p-12 text-center">
          <Loader2 className="w-16 h-16 text-pink-500 mx-auto mb-4 animate-spin" />
          <h3 className="text-xl font-semibold mb-2">Analyzing Brand Consistency...</h3>
          <p className="text-zinc-500">AI is reviewing all your brand assets</p>
        </GlassCard>
      )}

      {latestAudit && (
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="grid lg:grid-cols-3 gap-6">
            <GlassCard className="p-6 bg-gradient-to-br from-pink-500/10 to-rose-600/10">
              <h4 className="text-sm text-zinc-400 mb-2">Overall Consistency</h4>
              <div className="flex items-end gap-3">
                <p className="text-4xl font-bold">{latestAudit.overall_score}</p>
                <p className="text-zinc-500 mb-1">/100</p>
              </div>
              <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-pink-500 to-rose-600 rounded-full"
                  style={{ width: `${latestAudit.overall_score}%` }}
                />
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-5 h-5 text-blue-400" />
                <h4 className="text-sm text-zinc-400">Voice Consistency</h4>
              </div>
              <p className="text-3xl font-bold mb-2">{latestAudit.voice_consistency?.score || 0}/100</p>
              <p className="text-xs text-zinc-500">{latestAudit.voice_consistency?.analysis}</p>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Palette className="w-5 h-5 text-pink-400" />
                <h4 className="text-sm text-zinc-400">Visual Consistency</h4>
              </div>
              <p className="text-3xl font-bold mb-2">{latestAudit.visual_consistency?.score || 0}/100</p>
              <p className="text-xs text-zinc-500">{latestAudit.visual_consistency?.analysis}</p>
            </GlassCard>
          </div>

          {/* Inconsistencies */}
          {latestAudit.inconsistencies?.length > 0 && (
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                Inconsistencies Found ({latestAudit.inconsistencies.length})
              </h3>
              <div className="space-y-3">
                {latestAudit.inconsistencies.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={severityColors[item.severity] || severityColors.low}>
                            {item.severity?.toUpperCase()}
                          </Badge>
                          <span className="text-sm text-zinc-400">{item.location}</span>
                        </div>
                        <p className="font-medium text-sm">{item.issue}</p>
                      </div>
                    </div>
                    <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-xs text-emerald-400 font-medium mb-1">Suggested Fix:</p>
                      <p className="text-sm text-zinc-300">{item.suggestion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {latestAudit.inconsistencies?.length === 0 && (
            <GlassCard className="p-8 text-center bg-gradient-to-br from-emerald-500/10 to-teal-600/10">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">Perfect Brand Consistency!</h3>
              <p className="text-zinc-400">No inconsistencies found across your brand assets.</p>
            </GlassCard>
          )}
        </div>
      )}
    </div>
  );
}