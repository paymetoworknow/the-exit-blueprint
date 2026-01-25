import React, { useState } from 'react';
import { entities, integrations } from '@/api/entities';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, Loader2, Target, Send, Calendar, CheckCircle, Mail
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function InvestorMatching({ currentBusiness, currentFinancials, currentMarket }) {
  const queryClient = useQueryClient();
  const [isMatching, setIsMatching] = useState(false);
  const [matchedInvestors, setMatchedInvestors] = useState([]);
  const [selectedInvestor, setSelectedInvestor] = useState(null);

  const runMatchingMutation = useMutation({
    mutationFn: async () => {
      setIsMatching(true);

      // Get investor database
      const investorSearch = await base44.functions.invoke('searchInvestors', {
        industry: currentBusiness?.industry,
        funding_stage: currentFinancials?.funding_raised > 5000000 ? 'series_b' : 
                      currentFinancials?.funding_raised > 1000000 ? 'series_a' : 'seed',
        min_check_size: 0
      });

      const investors = investorSearch.data?.investors || [];

      // AI-powered matching analysis
      const prompt = `Analyze and rank these investors for ${currentBusiness?.business_name}:

BUSINESS PROFILE:
Industry: ${currentBusiness?.industry}
Business Model: ${currentBusiness?.business_model}
Stage: ${currentBusiness?.current_stage}/5
Revenue: $${currentFinancials?.annual_revenue || 0}
Valuation: $${currentFinancials?.valuation || 0}
Customer Count: ${currentFinancials?.customer_count || 0}
Market Size (TAM): $${currentMarket?.tam || 0}

INVESTORS TO ANALYZE:
${investors.map((inv, i) => `
${i + 1}. ${inv.name} (${inv.partner})
   Focus: ${inv.focus_industries.join(', ')}
   Stages: ${inv.funding_stages.join(', ')}
   Check Size: $${inv.check_size_min}-$${inv.check_size_max}
   Thesis: ${inv.investment_thesis}
   Portfolio: ${inv.portfolio_companies.join(', ')}
`).join('\n')}

For EACH investor, provide:
1. Match Score (0-100) based on fit
2. Match Reasoning (why good/bad fit, 2-3 sentences)
3. Key Alignment Points (what aligns well)
4. Potential Concerns (what might not align)
5. Outreach Priority (immediate/high/medium/low)
6. Suggested talking points for initial outreach

Rank by match score.`;

      const result = await integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            matched_investors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  investor_name: { type: "string" },
                  investor_email: { type: "string" },
                  match_score: { type: "number" },
                  match_reasoning: { type: "string" },
                  alignment_points: { type: "array", items: { type: "string" } },
                  concerns: { type: "array", items: { type: "string" } },
                  outreach_priority: { type: "string" },
                  talking_points: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      // Merge with investor data
      const enrichedMatches = result.matched_investors.map(match => {
        const investorData = investors.find(inv => inv.name === match.investor_name);
        return { ...investorData, ...match };
      });

      // Save top matches to InvestorOutreach entity
      const topMatches = enrichedMatches.slice(0, 10);
      for (const match of topMatches) {
        try {
          await entities.InvestorOutreach.create({
            business_id: currentBusiness.id,
            investor_name: match.investor_name,
            investor_email: match.investor_email || match.email,
            match_score: match.match_score,
            match_reasoning: match.match_reasoning,
            outreach_status: 'recommended'
          });
        } catch (err) {
          console.error('Failed to save investor match:', err);
        }
      }

      return enrichedMatches;
    },
    onSuccess: (data) => {
      setMatchedInvestors(data);
      setIsMatching(false);
      queryClient.invalidateQueries({ queryKey: ['investor-outreach'] });
    },
    onError: () => setIsMatching(false),
  });

  const sendAutomatedOutreachMutation = useMutation({
    mutationFn: async ({ investor, talkingPoints }) => {
      // Generate personalized email
      const emailPrompt = `Write a professional, personalized cold outreach email to ${investor.investor_name} (${investor.name}):

INVESTOR PROFILE:
Name: ${investor.partner}
Firm: ${investor.name}
Investment Thesis: ${investor.investment_thesis}
Portfolio: ${investor.portfolio_companies?.join(', ')}
Focus: ${investor.focus_industries?.join(', ')}

OUR BUSINESS:
Name: ${currentBusiness?.business_name}
Tagline: ${currentBusiness?.tagline}
Industry: ${currentBusiness?.industry}
Problem: ${currentBusiness?.problem_statement}
Solution: ${currentBusiness?.solution}
Traction: $${currentFinancials?.annual_revenue} ARR, ${currentFinancials?.customer_count} customers

KEY TALKING POINTS TO INCLUDE:
${talkingPoints.join('\n')}

WHY THIS INVESTOR IS A GREAT FIT:
${investor.match_reasoning}

Write a concise, compelling email (300-400 words) that:
1. Opens with a relevant hook tied to their portfolio/thesis
2. Briefly introduces the business
3. Highlights 2-3 key metrics or achievements
4. Explains why we're a great fit for their fund
5. Requests a brief intro call
6. Professional sign-off

Tone: Professional but warm, confident without being arrogant`;

      const emailResult = await integrations.Core.InvokeLLM({
        prompt: emailPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            subject: { type: "string" },
            body: { type: "string" }
          }
        }
      });

      // Send email
      await integrations.Core.SendEmail({
        to: investor.investor_email || investor.email,
        subject: emailResult.subject,
        body: emailResult.body
      });

      // Update outreach record
      const outreachRecord = await entities.InvestorOutreach.filter({
        business_id: currentBusiness.id,
        investor_email: investor.investor_email || investor.email
      });

      if (outreachRecord?.[0]) {
        const followUpDate = new Date();
        followUpDate.setDate(followUpDate.getDate() + 7);

        await entities.InvestorOutreach.update(outreachRecord[0].id, {
          outreach_status: 'sent',
          email_sent_date: new Date().toISOString(),
          follow_up_date: followUpDate.toISOString(),
          email_content: emailResult.body
        });
      }

      // Add to CRM
      await entities.CRMLead.create({
        business_id: currentBusiness.id,
        name: investor.partner,
        company: investor.name,
        email: investor.investor_email || investor.email,
        lead_type: 'investor',
        status: 'contacted',
        deal_size: investor.check_size_min,
        notes: `AI-matched (${investor.match_score}% fit). Outreach sent: ${new Date().toLocaleDateString()}`
      });

      return emailResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investor-outreach'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setSelectedInvestor(null);
    },
  });

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Target className="w-5 h-5 text-violet-400" />
              AI Investor Matching
            </h3>
            <p className="text-sm text-zinc-400 mt-1">
              Find and rank investors based on fit with your business
            </p>
          </div>
          <Button
            onClick={() => runMatchingMutation.mutate()}
            disabled={isMatching}
            className="bg-gradient-to-r from-violet-500 to-purple-600"
          >
            {isMatching ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Matching...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Find Matches
              </>
            )}
          </Button>
        </div>
      </GlassCard>

      {matchedInvestors.length > 0 && (
        <div className="space-y-4">
          {matchedInvestors.map((investor, idx) => (
            <GlassCard key={idx} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center text-violet-400 font-bold">
                    #{idx + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">{investor.name}</h4>
                    <p className="text-sm text-zinc-400">{investor.partner}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-violet-500/20 text-violet-400">
                        {investor.match_score}% Match
                      </Badge>
                      <Badge className={
                        investor.outreach_priority === 'immediate' ? 'bg-red-500/20 text-red-400' :
                        investor.outreach_priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-blue-500/20 text-blue-400'
                      }>
                        {investor.outreach_priority} priority
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-zinc-300 mb-4">{investor.match_reasoning}</p>

              <div className="grid lg:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-emerald-400 font-medium mb-2">Alignment Points:</p>
                  <ul className="space-y-1">
                    {investor.alignment_points?.map((point, i) => (
                      <li key={i} className="text-xs text-zinc-400 flex items-start gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
                {investor.concerns?.length > 0 && (
                  <div>
                    <p className="text-xs text-amber-400 font-medium mb-2">Potential Concerns:</p>
                    <ul className="space-y-1">
                      {investor.concerns.map((concern, i) => (
                        <li key={i} className="text-xs text-zinc-400 flex items-start gap-1">
                          <span className="text-amber-400">•</span>
                          {concern}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    className="w-full bg-gradient-to-r from-violet-500 to-purple-600"
                    onClick={() => setSelectedInvestor(investor)}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send AI-Generated Outreach
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#12121a] border-white/10 max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Automated Outreach - {investor.name}</DialogTitle>
                  </DialogHeader>
                  <AutomatedOutreachDialog
                    investor={investor}
                    onSend={(talkingPoints) => sendAutomatedOutreachMutation.mutate({ investor, talkingPoints })}
                    isSending={sendAutomatedOutreachMutation.isPending}
                  />
                </DialogContent>
              </Dialog>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

function AutomatedOutreachDialog({ investor, onSend, isSending }) {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-violet-500/10 border border-violet-500/20">
        <h4 className="text-sm font-semibold text-violet-400 mb-2">AI Will Generate & Send:</h4>
        <ul className="space-y-1 text-sm text-zinc-300">
          <li className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            Personalized email based on investor's thesis and portfolio
          </li>
          <li className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-violet-400" />
            Professional outreach highlighting your key metrics
          </li>
          <li className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-violet-400" />
            7-day follow-up reminder automatically scheduled
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-violet-400" />
            Investor added to CRM as "Contacted"
          </li>
        </ul>
      </div>

      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
        <p className="text-sm font-semibold mb-2">AI Talking Points:</p>
        <ul className="space-y-1">
          {investor.talking_points?.map((point, idx) => (
            <li key={idx} className="text-sm text-zinc-300 flex items-start gap-2">
              <span className="text-violet-400">•</span>
              {point}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={() => onSend(investor.talking_points || [])}
          disabled={isSending}
          className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600"
        >
          {isSending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating & Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Generate & Send Email
            </>
          )}
        </Button>
      </div>
    </div>
  );
}