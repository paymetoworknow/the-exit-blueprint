import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Share2, Mail, Eye, Clock, MessageSquare, Users,
  Sparkles, Loader2, AlertCircle, CheckCircle, Trash2, Copy, Check, TrendingUp, TrendingDown, Target
} from 'lucide-react';
import InvestorMatching from '@/components/InvestorMatching';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';
import StageHeader from '@/components/ui/StageHeader';

const contentTypes = [
  { value: 'pitch_deck', label: 'Pitch Deck', icon: '📊' },
  { value: 'risk_analysis', label: 'Risk Analysis', icon: '⚠️' },
  { value: 'financials', label: 'Financial Projections', icon: '💰' },
  { value: 'market_analysis', label: 'Market Analysis', icon: '📈' },
  { value: 'full_report', label: 'Complete Business Report', icon: '📄' },
];

export default function Collaboration() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('shared');
  const [isAnalyzingFeedback, setIsAnalyzingFeedback] = useState(false);
  const [feedbackSummary, setFeedbackSummary] = useState(null);
  const [copiedLink, setCopiedLink] = useState(null);

  const { data: businesses } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => base44.entities.BusinessCore.list('-created_date', 1),
  });

  const { data: sharedContent } = useQuery({
    queryKey: ['shared-content'],
    queryFn: () => base44.entities.SharedContent.list('-created_date'),
    enabled: !!businesses?.[0],
  });

  const { data: feedback } = useQuery({
    queryKey: ['feedback'],
    queryFn: () => base44.entities.Feedback.list('-created_date'),
    enabled: !!businesses?.[0],
  });

  const { data: financials } = useQuery({
    queryKey: ['financials'],
    queryFn: () => base44.entities.Financials.list('-created_date', 1),
    enabled: !!businesses?.[0],
  });

  const { data: marketData } = useQuery({
    queryKey: ['market-analysis'],
    queryFn: () => base44.entities.MarketAnalysis.list('-created_date', 1),
    enabled: !!businesses?.[0],
  });

  const currentBusiness = businesses?.[0];
  const currentFinancials = financials?.[0];
  const currentMarket = marketData?.[0];

  const createShareMutation = useMutation({
    mutationFn: async (data) => {
      const token = Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      return base44.entities.SharedContent.create({
        ...data,
        business_id: currentBusiness.id,
        share_token: token,
        expires_at: expiresAt.toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-content'] });
    },
  });

  const deleteShareMutation = useMutation({
    mutationFn: (id) => base44.entities.SharedContent.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shared-content'] }),
  });

  const analyzeFeedbackMutation = useMutation({
    mutationFn: async () => {
      setIsAnalyzingFeedback(true);

      const allFeedback = feedback?.filter(f => f.business_id === currentBusiness.id) || [];

      if (allFeedback.length === 0) {
        throw new Error('No feedback available to analyze');
      }

      const prompt = `Analyze the following feedback from team members and advisors for ${currentBusiness.business_name}:

${allFeedback.map((f, i) => `
Feedback ${i + 1} (from ${f.author_name}, ${f.section || 'General'}):
"${f.feedback_text}"
`).join('\n')}

Provide a comprehensive analysis:
1. Key Themes - What are the main topics/concerns raised? (3-5 themes)
2. Sentiment Overview - Overall sentiment breakdown (positive, neutral, negative %)
3. Priority Action Items - What needs immediate attention? (top 5)
4. Strengths Identified - What did people praise?
5. Concerns Raised - What are the main worries or criticisms?
6. Recommendations - What should the team focus on based on this feedback?`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            key_themes: { type: "array", items: { type: "string" } },
            sentiment_breakdown: {
              type: "object",
              properties: {
                positive: { type: "number" },
                neutral: { type: "number" },
                negative: { type: "number" }
              }
            },
            priority_actions: { type: "array", items: { type: "string" } },
            strengths: { type: "array", items: { type: "string" } },
            concerns: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      });

      return result;
    },
    onSuccess: (data) => {
      setFeedbackSummary(data);
      setIsAnalyzingFeedback(false);
    },
    onError: () => {
      setIsAnalyzingFeedback(false);
      alert('Failed to analyze feedback. Please ensure you have feedback to analyze.');
    },
  });

  const copyShareLink = (token) => {
    const link = `${window.location.origin}/shared/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(token);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <StageHeader
        stageNumber="AI"
        title="Collaboration Hub"
        subtitle="Share insights and get AI-powered feedback analysis"
        icon={Users}
        gradient="from-blue-500 to-cyan-500"
      >
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-cyan-500">
              <Share2 className="w-4 h-4 mr-2" />
              Share Content
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#12121a] border-white/10">
            <DialogHeader>
              <DialogTitle>Share Business Content</DialogTitle>
            </DialogHeader>
            <ShareForm 
              onSubmit={(data) => createShareMutation.mutate(data)}
              isLoading={createShareMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </StageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="shared" className="data-[state=active]:bg-white/10">
            <Share2 className="w-4 h-4 mr-2" />
            Shared Content
          </TabsTrigger>
          <TabsTrigger value="feedback" className="data-[state=active]:bg-white/10">
            <MessageSquare className="w-4 h-4 mr-2" />
            Feedback ({feedback?.filter(f => f.business_id === currentBusiness?.id).length || 0})
          </TabsTrigger>
          <TabsTrigger value="outreach" className="data-[state=active]:bg-white/10">
            <Target className="w-4 h-4 mr-2" />
            Investor Outreach
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shared">
          <SharedContentView 
            sharedContent={sharedContent?.filter(s => s.business_id === currentBusiness?.id) || []}
            onDelete={(id) => deleteShareMutation.mutate(id)}
            onCopyLink={copyShareLink}
            copiedLink={copiedLink}
          />
        </TabsContent>

        <TabsContent value="feedback">
          <FeedbackView 
            feedback={feedback?.filter(f => f.business_id === currentBusiness?.id) || []}
            feedbackSummary={feedbackSummary}
            isAnalyzing={isAnalyzingFeedback}
            onAnalyze={() => analyzeFeedbackMutation.mutate()}
          />
        </TabsContent>

        <TabsContent value="outreach">
          <InvestorMatching
            currentBusiness={currentBusiness}
            currentFinancials={currentFinancials}
            currentMarket={currentMarket}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ShareForm({ onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    content_type: 'pitch_deck',
    recipient_email: '',
    recipient_name: '',
    access_level: 'view',
    message: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Content Type</Label>
        <Select value={formData.content_type} onValueChange={v => setFormData(p => ({ ...p, content_type: v }))}>
          <SelectTrigger className="mt-1.5 bg-white/5 border-white/10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {contentTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.icon} {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Recipient Name</Label>
          <Input
            value={formData.recipient_name}
            onChange={e => setFormData(p => ({ ...p, recipient_name: e.target.value }))}
            placeholder="John Doe"
            required
            className="mt-1.5 bg-white/5 border-white/10"
          />
        </div>
        <div>
          <Label>Recipient Email</Label>
          <Input
            type="email"
            value={formData.recipient_email}
            onChange={e => setFormData(p => ({ ...p, recipient_email: e.target.value }))}
            placeholder="john@example.com"
            required
            className="mt-1.5 bg-white/5 border-white/10"
          />
        </div>
      </div>

      <div>
        <Label>Access Level</Label>
        <Select value={formData.access_level} onValueChange={v => setFormData(p => ({ ...p, access_level: v }))}>
          <SelectTrigger className="mt-1.5 bg-white/5 border-white/10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="view">View Only</SelectItem>
            <SelectItem value="comment">View & Comment</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Personal Message (Optional)</Label>
        <Textarea
          value={formData.message}
          onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
          placeholder="Add a personal note to your recipient..."
          className="mt-1.5 bg-white/5 border-white/10"
          rows={3}
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-blue-500 to-cyan-500">
        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Share2 className="w-4 h-4 mr-2" />}
        Create Share Link
      </Button>
    </form>
  );
}

function SharedContentView({ sharedContent, onDelete, onCopyLink, copiedLink }) {
  if (sharedContent.length === 0) {
    return (
      <GlassCard className="p-12 text-center">
        <Share2 className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Shared Content</h3>
        <p className="text-zinc-500 max-w-md mx-auto">
          Share your pitch deck, financials, or reports with team members, advisors, or investors
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      {sharedContent.map((share) => {
        const contentType = contentTypes.find(t => t.value === share.content_type);
        const shareLink = `${window.location.origin}/shared/${share.share_token}`;

        return (
          <GlassCard key={share.id} className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{contentType?.icon}</span>
                  <div>
                    <h4 className="font-semibold">{contentType?.label}</h4>
                    <p className="text-sm text-zinc-400">Shared with {share.recipient_name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-zinc-500" />
                    <span className="text-zinc-400">{share.recipient_email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Eye className="w-4 h-4 text-zinc-500" />
                    <span className="text-zinc-400">{share.view_count} views</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-zinc-500" />
                    <span className="text-zinc-400">
                      Expires {new Date(share.expires_at).toLocaleDateString()}
                    </span>
                  </div>
                  <Badge className={
                    share.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 
                    'bg-zinc-500/20 text-zinc-400'
                  }>
                    {share.status}
                  </Badge>
                </div>

                {share.message && (
                  <div className="mt-3 p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-sm text-zinc-300">{share.message}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCopyLink(share.share_token)}
                  className="border-white/10"
                >
                  {copiedLink === share.share_token ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(share.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}

function FeedbackView({ feedback, feedbackSummary, isAnalyzing, onAnalyze }) {
  return (
    <div className="space-y-6">
      {/* Analyze Button & Summary */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">AI Feedback Analysis</h3>
            <p className="text-sm text-zinc-400">
              Get AI-powered insights from all feedback received
            </p>
          </div>
          <Button
            onClick={onAnalyze}
            disabled={isAnalyzing || feedback.length === 0}
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
                Analyze Feedback
              </>
            )}
          </Button>
        </div>

        {feedbackSummary && (
          <div className="space-y-6 mt-6 pt-6 border-t border-white/10">
            {/* Sentiment */}
            <div>
              <h4 className="font-semibold mb-3">Sentiment Overview</h4>
              <div className="flex gap-4">
                <div className="flex-1 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span className="text-2xl font-bold text-emerald-400">
                      {feedbackSummary.sentiment_breakdown?.positive || 0}%
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">Positive</p>
                </div>
                <div className="flex-1 p-4 rounded-lg bg-zinc-500/10 border border-zinc-500/20">
                  <span className="text-2xl font-bold text-zinc-400">
                    {feedbackSummary.sentiment_breakdown?.neutral || 0}%
                  </span>
                  <p className="text-xs text-zinc-400">Neutral</p>
                </div>
                <div className="flex-1 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingDown className="w-4 h-4 text-red-400" />
                    <span className="text-2xl font-bold text-red-400">
                      {feedbackSummary.sentiment_breakdown?.negative || 0}%
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">Negative</p>
                </div>
              </div>
            </div>

            {/* Key Themes */}
            <div>
              <h4 className="font-semibold mb-3">Key Themes</h4>
              <div className="flex flex-wrap gap-2">
                {feedbackSummary.key_themes?.map((theme, idx) => (
                  <Badge key={idx} className="bg-blue-500/20 text-blue-400">{theme}</Badge>
                ))}
              </div>
            </div>

            {/* Priority Actions */}
            <div>
              <h4 className="font-semibold mb-3">Priority Action Items</h4>
              <ul className="space-y-2">
                {feedbackSummary.priority_actions?.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span className="text-zinc-300">{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Strengths & Concerns */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 text-emerald-400">Strengths Identified</h4>
                <ul className="space-y-2">
                  {feedbackSummary.strengths?.map((strength, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-zinc-300">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-amber-400">Concerns Raised</h4>
                <ul className="space-y-2">
                  {feedbackSummary.concerns?.map((concern, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span className="text-zinc-300">{concern}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Individual Feedback Items */}
      <div className="space-y-3">
        {feedback.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <MessageSquare className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Feedback Yet</h3>
            <p className="text-zinc-500">
              Share your content to start receiving feedback from collaborators
            </p>
          </GlassCard>
        ) : (
          feedback.map((item) => (
            <GlassCard key={item.id} className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">{item.author_name}</span>
                    {item.section && (
                      <Badge variant="outline" className="border-white/10 text-xs">
                        {item.section}
                      </Badge>
                    )}
                    {item.sentiment && (
                      <Badge className={
                        item.sentiment === 'positive' ? 'bg-emerald-500/20 text-emerald-400' :
                        item.sentiment === 'negative' ? 'bg-red-500/20 text-red-400' :
                        'bg-zinc-500/20 text-zinc-400'
                      }>
                        {item.sentiment}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">{item.feedback_text}</p>
                  <p className="text-xs text-zinc-500 mt-2">
                    {new Date(item.created_date).toLocaleString()}
                  </p>
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}