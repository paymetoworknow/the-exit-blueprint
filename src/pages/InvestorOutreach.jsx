import React, { useState, useCallback } from 'react';
import { entities, integrations } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Target, Loader2, Send, CheckCircle, Clock, XCircle,
  Mail, Calendar, Sparkles, Filter, TrendingUp, Users,
  Search, Plus, Eye
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import StageHeader from '@/components/ui/StageHeader';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function InvestorOutreach() {
  const queryClient = useQueryClient();
  const [searchCriteria, setSearchCriteria] = useState({
    industry: '',
    funding_stage: 'seed',
    min_investment: 100000,
    max_investment: 5000000,
  });
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [customMessage, setCustomMessage] = useState('');

  const { data: businesses } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => entities.BusinessCore.list('-created_date', 1),
  });

  const { data: financials } = useQuery({
    queryKey: ['financials'],
    queryFn: () => entities.Financials.list('-created_date', 1),
  });

  const { data: market } = useQuery({
    queryKey: ['market-analysis'],
    queryFn: () => entities.MarketAnalysis.list('-created_date', 1),
  });

  const { data: outreachRecords, isLoading: loadingOutreach } = useQuery({
    queryKey: ['investor-outreach'],
    queryFn: () => entities.InvestorOutreach.list('-created_date', 100),
  });

  const currentBusiness = businesses?.[0];
  const currentFinancials = financials?.[0];
  const currentMarket = market?.[0];

  const searchInvestorsMutation = useMutation({
    mutationFn: async () => {
      setIsSearching(true);

      // Call backend to search investors
      const searchResponse = await base44.functions.invoke('searchInvestors', {
        industry: searchCriteria.industry || currentBusiness?.industry,
        funding_stage: searchCriteria.funding_stage,
        min_check_size: searchCriteria.min_investment
      });

      const investors = searchResponse.data?.investors || [];

      // AI-powered ranking and analysis
      const prompt = `Analyze and rank these investors for ${currentBusiness?.business_name}:

BUSINESS PROFILE:
- Industry: ${currentBusiness?.industry}
- Business Model: ${currentBusiness?.business_model}
- Stage: ${currentBusiness?.current_stage}/5
- Annual Revenue: $${currentFinancials?.annual_revenue || 0}
- Valuation: $${currentFinancials?.valuation || 0}
- Customer Count: ${currentFinancials?.customer_count || 0}
- Market Size (TAM): $${currentMarket?.tam || 0}
- Problem: ${currentBusiness?.problem_statement}
- Solution: ${currentBusiness?.solution}

INVESTORS:
${investors.map((inv, i) => `${i + 1}. ${inv.name} - ${inv.partner}
   Focus: ${inv.focus_industries?.join(', ')}
   Stage: ${inv.funding_stages?.join(', ')}
   Check Size: $${inv.check_size_min}-$${inv.check_size_max}
   Thesis: ${inv.investment_thesis}`).join('\n\n')}

For each investor, provide:
- match_score (0-100)
- match_reasoning (2-3 sentences)
- alignment_points (array of 3-4 strings)
- concerns (array of 1-2 strings)
- outreach_priority (immediate/high/medium/low)
- suggested_hook (personalized opening line for email)

Rank by match score descending.`;

      const analysis = await integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            matches: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  investor_name: { type: "string" },
                  match_score: { type: "number" },
                  match_reasoning: { type: "string" },
                  alignment_points: { type: "array", items: { type: "string" } },
                  concerns: { type: "array", items: { type: "string" } },
                  outreach_priority: { type: "string" },
                  suggested_hook: { type: "string" }
                }
              }
            }
          }
        }
      });

      // Merge analysis with investor data
      const enrichedResults = analysis.matches.map(match => {
        const investorData = investors.find(inv => inv.name === match.investor_name);
        return { ...investorData, ...match };
      });

      return enrichedResults;
    },
    onSuccess: (data) => {
      setSearchResults(data);
      setIsSearching(false);
    },
    onError: () => setIsSearching(false)
  });

  const saveToOutreachMutation = useMutation({
    mutationFn: async (investor) => {
      return await entities.InvestorOutreach.create({
        business_id: currentBusiness.id,
        investor_name: investor.name,
        investor_email: investor.email,
        match_score: investor.match_score,
        match_reasoning: investor.match_reasoning,
        outreach_status: 'recommended'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investor-outreach'] });
    }
  });

  const sendOutreachMutation = useMutation({
    mutationFn: async ({ investor, messageOverride }) => {
      // Generate personalized email
      const emailPrompt = `Write a professional cold outreach email to ${investor.name} (Partner: ${investor.partner}):

INVESTOR PROFILE:
- Firm: ${investor.name}
- Partner: ${investor.partner}
- Investment Focus: ${investor.focus_industries?.join(', ')}
- Investment Thesis: ${investor.investment_thesis}
- Check Size: $${investor.check_size_min}-$${investor.check_size_max}

OUR BUSINESS:
- Name: ${currentBusiness?.business_name}
- Tagline: ${currentBusiness?.tagline}
- Industry: ${currentBusiness?.industry}
- Problem: ${currentBusiness?.problem_statement}
- Solution: ${currentBusiness?.solution}
- Traction: $${currentFinancials?.annual_revenue} ARR, ${currentFinancials?.customer_count} customers
- Valuation: $${currentFinancials?.valuation}

WHY THIS IS A GREAT FIT:
${investor.match_reasoning}

SUGGESTED HOOK:
${investor.suggested_hook}

${messageOverride ? `CUSTOM MESSAGE TO INCORPORATE:\n${messageOverride}\n` : ''}

Write a 300-400 word email with:
1. Compelling subject line
2. Personalized opening using the suggested hook
3. Brief business introduction
4. 2-3 key metrics/achievements
5. Why we're a fit for their portfolio
6. Clear call-to-action (15-min intro call)
7. Professional closing

Tone: Professional, confident, data-driven.`;

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
        to: investor.email,
        subject: emailResult.subject,
        body: emailResult.body
      });

      // Update or create outreach record
      const existingRecord = outreachRecords?.find(
        r => r.investor_email === investor.email && r.business_id === currentBusiness.id
      );

      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + 7);

      if (existingRecord) {
        await entities.InvestorOutreach.update(existingRecord.id, {
          outreach_status: 'sent',
          email_sent_date: new Date().toISOString(),
          follow_up_date: followUpDate.toISOString(),
          email_content: emailResult.body
        });
      } else {
        await entities.InvestorOutreach.create({
          business_id: currentBusiness.id,
          investor_name: investor.name,
          investor_email: investor.email,
          match_score: investor.match_score,
          match_reasoning: investor.match_reasoning,
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
        email: investor.email,
        lead_type: 'investor',
        status: 'contacted',
        deal_size: investor.check_size_min,
        notes: `AI-matched (${investor.match_score}% fit). ${investor.match_reasoning}`
      });

      return emailResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investor-outreach'] });
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
      setSelectedInvestor(null);
      setCustomMessage('');
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ recordId, status }) => {
      return await entities.InvestorOutreach.update(recordId, {
        outreach_status: status,
        response_received: status === 'responded'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investor-outreach'] });
    }
  });

  const stats = {
    total: outreachRecords?.length || 0,
    recommended: outreachRecords?.filter(r => r.outreach_status === 'recommended').length || 0,
    sent: outreachRecords?.filter(r => r.outreach_status === 'sent').length || 0,
    responded: outreachRecords?.filter(r => r.outreach_status === 'responded').length || 0,
    meeting: outreachRecords?.filter(r => r.outreach_status === 'meeting').length || 0,
    avgMatchScore: outreachRecords?.length > 0 
      ? outreachRecords.reduce((sum, r) => sum + (r.match_score || 0), 0) / outreachRecords.length 
      : 0
  };

  // Memoized handlers for search criteria updates
  const handleIndustryChange = useCallback((e) => {
    setSearchCriteria(prev => ({ ...prev, industry: e.target.value }));
  }, []);

  const handleFundingStageChange = useCallback((value) => {
    setSearchCriteria(prev => ({ ...prev, funding_stage: value }));
  }, []);

  const handleMinInvestmentChange = useCallback((e) => {
    setSearchCriteria(prev => ({ ...prev, min_investment: Number(e.target.value) }));
  }, []);

  const handleMaxInvestmentChange = useCallback((e) => {
    setSearchCriteria(prev => ({ ...prev, max_investment: Number(e.target.value) }));
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      <StageHeader
        stageNumber={3}
        title="Investor Outreach"
        subtitle="AI-Powered Investor Discovery & Automated Outreach"
        icon={Target}
        gradient="from-emerald-500 to-teal-500"
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard label="Total Investors" value={stats.total} icon={Users} color="violet" />
        <StatCard label="Recommended" value={stats.recommended} icon={Sparkles} color="blue" />
        <StatCard label="Contacted" value={stats.sent} icon={Send} color="emerald" />
        <StatCard label="Responded" value={stats.responded} icon={CheckCircle} color="amber" />
        <StatCard label="Avg Match Score" value={`${stats.avgMatchScore.toFixed(0)}%`} icon={TrendingUp} color="rose" />
      </div>

      <Tabs defaultValue="search" className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="search">
            <Search className="w-4 h-4 mr-2" />
            Search Investors
          </TabsTrigger>
          <TabsTrigger value="tracked">
            <Eye className="w-4 h-4 mr-2" />
            Tracked Outreach ({stats.total})
          </TabsTrigger>
        </TabsList>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-6">
          {/* Search Criteria */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-violet-400" />
              Search Criteria
            </h3>
            <div className="grid lg:grid-cols-4 gap-4">
              <div>
                <Label>Industry Focus</Label>
                <Input
                  placeholder={currentBusiness?.industry || "e.g. SaaS, FinTech"}
                  value={searchCriteria.industry}
                  onChange={handleIndustryChange}
                  className="mt-2 bg-white/5 border-white/10"
                />
              </div>
              <div>
                <Label>Funding Stage</Label>
                <Select
                  value={searchCriteria.funding_stage}
                  onValueChange={handleFundingStageChange}
                >
                  <SelectTrigger className="mt-2 bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pre_seed">Pre-Seed</SelectItem>
                    <SelectItem value="seed">Seed</SelectItem>
                    <SelectItem value="series_a">Series A</SelectItem>
                    <SelectItem value="series_b">Series B</SelectItem>
                    <SelectItem value="series_c">Series C+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Min Investment</Label>
                <Input
                  type="number"
                  value={searchCriteria.min_investment}
                  onChange={handleMinInvestmentChange}
                  className="mt-2 bg-white/5 border-white/10"
                />
              </div>
              <div>
                <Label>Max Investment</Label>
                <Input
                  type="number"
                  value={searchCriteria.max_investment}
                  onChange={handleMaxInvestmentChange}
                  className="mt-2 bg-white/5 border-white/10"
                />
              </div>
            </div>
            <Button
              onClick={() => searchInvestorsMutation.mutate()}
              disabled={isSearching || !currentBusiness}
              className="mt-4 bg-gradient-to-r from-violet-500 to-purple-600"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching & Analyzing...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search Investors
                </>
              )}
            </Button>
          </GlassCard>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-zinc-300">
                Found {searchResults.length} Matching Investors
              </h3>
              {searchResults.map((investor, idx) => (
                <InvestorCard
                  key={idx}
                  investor={investor}
                  rank={idx + 1}
                  onSave={() => saveToOutreachMutation.mutate(investor)}
                  onSendOutreach={() => setSelectedInvestor(investor)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tracked Outreach Tab */}
        <TabsContent value="tracked" className="space-y-4">
          {loadingOutreach ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
          ) : outreachRecords?.length > 0 ? (
            outreachRecords.map((record) => (
              <OutreachRecordCard
                key={record.id}
                record={record}
                onUpdateStatus={(status) => updateStatusMutation.mutate({ recordId: record.id, status })}
              />
            ))
          ) : (
            <GlassCard className="p-12 text-center">
              <Target className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400">No investor outreach tracked yet. Start by searching for investors.</p>
            </GlassCard>
          )}
        </TabsContent>
      </Tabs>

      {/* Send Outreach Dialog */}
      {selectedInvestor && (
        <Dialog open={!!selectedInvestor} onOpenChange={() => setSelectedInvestor(null)}>
          <DialogContent className="bg-[#12121a] border-white/10 max-w-2xl">
            <DialogHeader>
              <DialogTitle>Send Outreach - {selectedInvestor.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-violet-500/10 border border-violet-500/20">
                <p className="text-sm text-violet-400 font-semibold mb-2">AI Will Generate:</p>
                <ul className="space-y-1 text-sm text-zinc-300">
                  <li className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    Personalized email based on {selectedInvestor.match_score}% match
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-violet-400" />
                    Tailored to their investment thesis and portfolio
                  </li>
                  <li className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-violet-400" />
                    7-day follow-up automatically scheduled
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-sm font-semibold mb-2">Suggested Hook:</p>
                <p className="text-sm text-zinc-300 italic">"{selectedInvestor.suggested_hook}"</p>
              </div>

              <div>
                <Label>Custom Message (Optional)</Label>
                <Textarea
                  placeholder="Add any custom notes or points to include..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="mt-2 bg-white/5 border-white/10 h-24"
                />
              </div>

              <Button
                onClick={() => sendOutreachMutation.mutate({ investor: selectedInvestor, messageOverride: customMessage })}
                disabled={sendOutreachMutation.isPending}
                className="w-full bg-gradient-to-r from-violet-500 to-purple-600"
              >
                {sendOutreachMutation.isPending ? (
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
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  const colors = {
    violet: 'from-violet-500/20 to-purple-600/20 border-violet-500/30',
    blue: 'from-blue-500/20 to-cyan-600/20 border-blue-500/30',
    emerald: 'from-emerald-500/20 to-teal-600/20 border-emerald-500/30',
    amber: 'from-amber-500/20 to-orange-600/20 border-amber-500/30',
    rose: 'from-rose-500/20 to-pink-600/20 border-rose-500/30',
  };

  return (
    <GlassCard className={`p-4 bg-gradient-to-br ${colors[color]} border`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-white/70" />
        <span className="text-xs text-zinc-400">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </GlassCard>
  );
}

function InvestorCard({ investor, rank, onSave, onSendOutreach }) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center text-violet-400 font-bold">
            #{rank}
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
          <p className="text-xs text-emerald-400 font-medium mb-2">✓ Alignment:</p>
          <ul className="space-y-1">
            {investor.alignment_points?.map((point, i) => (
              <li key={i} className="text-xs text-zinc-400">• {point}</li>
            ))}
          </ul>
        </div>
        {investor.concerns?.length > 0 && (
          <div>
            <p className="text-xs text-amber-400 font-medium mb-2">⚠ Concerns:</p>
            <ul className="space-y-1">
              {investor.concerns.map((concern, i) => (
                <li key={i} className="text-xs text-zinc-400">• {concern}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button onClick={onSave} variant="outline" className="flex-1 border-white/10">
          <Plus className="w-4 h-4 mr-2" />
          Save to Tracker
        </Button>
        <Button onClick={onSendOutreach} className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600">
          <Send className="w-4 h-4 mr-2" />
          Send Outreach
        </Button>
      </div>
    </GlassCard>
  );
}

function OutreachRecordCard({ record, onUpdateStatus }) {
  const statusConfig = {
    recommended: { icon: Sparkles, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    sent: { icon: Send, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    responded: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20' },
    meeting_scheduled: { icon: Calendar, color: 'text-violet-400', bg: 'bg-violet-500/20' },
    passed: { icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-500/20' }
  };

  const config = statusConfig[record.outreach_status] || statusConfig.recommended;
  const Icon = config.icon;

  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="font-semibold text-lg">{record.investor_name}</h4>
            <Badge className={`${config.bg} ${config.color}`}>
              <Icon className="w-3 h-3 mr-1" />
              {record.outreach_status.replace(/_/g, ' ')}
            </Badge>
            {record.match_score && (
              <Badge className="bg-violet-500/20 text-violet-400">
                {record.match_score}% Match
              </Badge>
            )}
          </div>
          <p className="text-sm text-zinc-400 mb-3">{record.match_reasoning}</p>

          {record.email_sent_date && (
            <div className="flex items-center gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Sent: {new Date(record.email_sent_date).toLocaleDateString()}
              </span>
              {record.follow_up_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Follow-up: {new Date(record.follow_up_date).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Select value={record.outreach_status} onValueChange={onUpdateStatus}>
            <SelectTrigger className="w-40 bg-white/5 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recommended">Recommended</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="responded">Responded</SelectItem>
              <SelectItem value="meeting_scheduled">Meeting Scheduled</SelectItem>
              <SelectItem value="passed">Passed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </GlassCard>
  );
}