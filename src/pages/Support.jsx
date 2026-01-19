import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  MessageSquare, Send, Sparkles, Loader2, ThumbsUp, ThumbsDown,
  Ticket, TrendingUp, AlertCircle, CheckCircle, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GlassCard from '@/components/ui/GlassCard';
import StageHeader from '@/components/ui/StageHeader';

export default function Support() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('chat');
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));

  const { data: businesses } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => base44.entities.BusinessCore.list('-created_date', 1),
  });

  const { data: tickets } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: () => base44.entities.SupportTicket.list('-created_date'),
  });

  const currentBusiness = businesses?.[0];

  return (
    <div className="max-w-7xl mx-auto">
      <StageHeader
        stageNumber="AI"
        title="AI Support Assistant"
        subtitle="Get instant help with AI-powered chatbot and support ticket analysis"
        icon={MessageSquare}
        gradient="from-purple-500 to-pink-600"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="chat" className="data-[state=active]:bg-white/10">
            <MessageSquare className="w-4 h-4 mr-2" />
            AI Chat
          </TabsTrigger>
          <TabsTrigger value="tickets" className="data-[state=active]:bg-white/10">
            <Ticket className="w-4 h-4 mr-2" />
            Support Tickets
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-white/10">
            <BarChart3 className="w-4 h-4 mr-2" />
            Ticket Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <AIChatbot sessionId={sessionId} currentBusiness={currentBusiness} />
        </TabsContent>

        <TabsContent value="tickets">
          <SupportTickets 
            tickets={tickets?.filter(t => t.business_id === currentBusiness?.id) || []} 
            currentBusiness={currentBusiness}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <TicketAnalytics 
            tickets={tickets?.filter(t => t.business_id === currentBusiness?.id) || []}
            currentBusiness={currentBusiness}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AIChatbot({ sessionId, currentBusiness }) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m your AI support assistant. I can help you with questions about Exit Blueprint, form generation, business planning, and more. How can I assist you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (userMessage) => {
      setIsTyping(true);
      setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

      // Get business context
      const context = `You are a helpful AI support assistant for Exit Blueprint, a business planning platform. 

Current User's Business: ${currentBusiness?.business_name || 'N/A'}
Industry: ${currentBusiness?.industry || 'N/A'}

Platform Features:
- Stage 1 (Oracle): Business idea validation and market analysis
- Stage 2 (Architect): Brand identity and operational setup
- Stage 3 (Engine): Pitch deck generation and investor networking
- Stage 4 (Quant): Financial modeling and projections
- Stage 5 (Exit Vault): Due diligence and exit preparation
- Form Generator: 25+ legal and business document templates
- Business Plan Generator: Comprehensive AI-generated business plans
- Collaboration Hub: Content sharing and feedback management
- Risk Analysis: AI-powered risk assessment
- Brand Audit: Brand consistency checking

Common Topics:
- How to use different stages
- Form generation help
- Financial modeling questions
- Investor outreach guidance
- Document export options
- Business plan creation

User Question: ${userMessage}

Provide a helpful, concise response. If the question is complex or requires account-specific help, suggest creating a support ticket.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: context,
      });

      // Save messages
      await base44.entities.ChatMessage.create({
        business_id: currentBusiness?.id || 'anonymous',
        session_id: sessionId,
        role: 'user',
        content: userMessage
      });

      await base44.entities.ChatMessage.create({
        business_id: currentBusiness?.id || 'anonymous',
        session_id: sessionId,
        role: 'assistant',
        content: result
      });

      return result;
    },
    onSuccess: (response) => {
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setIsTyping(false);
    },
    onError: () => {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again or create a support ticket.' }]);
      setIsTyping(false);
    }
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessageMutation.mutate(input);
    setInput('');
  };

  return (
    <GlassCard className="p-6">
      <div className="flex flex-col h-[600px]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white' 
                  : 'bg-white/5 border border-white/10'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about Exit Blueprint..."
            className="flex-1 bg-white/5 border-white/10"
          />
          <Button 
            type="submit" 
            disabled={isTyping || !input.trim()}
            className="bg-gradient-to-r from-purple-500 to-pink-600"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>

        <p className="text-xs text-zinc-500 text-center mt-3">
          Need more help? Switch to the Support Tickets tab to create a detailed request.
        </p>
      </div>
    </GlassCard>
  );
}

function SupportTickets({ tickets, currentBusiness }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const createTicketMutation = useMutation({
    mutationFn: async (data) => {
      // AI analysis of ticket
      const analysisPrompt = `Analyze this support ticket:

Subject: ${data.subject}
Description: ${data.description}
Category: ${data.category}

Provide:
1. Priority level (low/medium/high/urgent)
2. Whether it needs human support (true/false)
3. Sentiment (positive/neutral/negative/urgent)
4. Relevant tags (array)
5. AI-generated response or solution`;

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: analysisPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            priority: { type: "string" },
            requires_human: { type: "boolean" },
            sentiment: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
            ai_response: { type: "string" }
          }
        }
      });

      return base44.entities.SupportTicket.create({
        ...data,
        business_id: currentBusiness.id,
        ...analysis
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      setShowForm(false);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-purple-500 to-pink-600"
        >
          <Ticket className="w-4 h-4 mr-2" />
          Create Ticket
        </Button>
      </div>

      {showForm && (
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold mb-4">New Support Ticket</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            createTicketMutation.mutate({
              subject: formData.get('subject'),
              description: formData.get('description'),
              category: formData.get('category')
            });
          }} className="space-y-4">
            <div>
              <Label>Subject</Label>
              <Input name="subject" required className="mt-1.5 bg-white/5 border-white/10" />
            </div>
            <div>
              <Label>Category</Label>
              <Select name="category" required defaultValue="general">
                <SelectTrigger className="mt-1.5 bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Technical Issue</SelectItem>
                  <SelectItem value="billing">Billing Question</SelectItem>
                  <SelectItem value="feature_request">Feature Request</SelectItem>
                  <SelectItem value="bug_report">Bug Report</SelectItem>
                  <SelectItem value="form_help">Form Generation Help</SelectItem>
                  <SelectItem value="general">General Question</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea name="description" required className="mt-1.5 bg-white/5 border-white/10" rows={4} />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="border-white/10">
                Cancel
              </Button>
              <Button type="submit" disabled={createTicketMutation.isPending} className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600">
                {createTicketMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Submit Ticket
              </Button>
            </div>
          </form>
        </GlassCard>
      )}

      {tickets.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <Ticket className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Support Tickets</h3>
          <p className="text-zinc-500">Create a ticket to get help with your questions</p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <GlassCard key={ticket.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-lg">{ticket.subject}</h4>
                  <p className="text-sm text-zinc-400 mt-1">{ticket.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={
                    ticket.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-400' :
                    ticket.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-amber-500/20 text-amber-400'
                  }>
                    {ticket.status}
                  </Badge>
                  <Badge className={
                    ticket.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                    ticket.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-zinc-500/20 text-zinc-400'
                  }>
                    {ticket.priority}
                  </Badge>
                </div>
              </div>

              {ticket.ai_response && (
                <div className="mt-4 p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <p className="text-xs font-semibold text-purple-400 mb-2">AI Response:</p>
                  <p className="text-sm text-zinc-300">{ticket.ai_response}</p>
                </div>
              )}

              {ticket.requires_human && (
                <div className="mt-3 flex items-center gap-2 text-sm text-amber-400">
                  <AlertCircle className="w-4 h-4" />
                  Escalated to human support
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

function TicketAnalytics({ tickets, currentBusiness }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const analyzeTickets = async () => {
    setIsAnalyzing(true);
    try {
      const prompt = `Analyze these support tickets for ${currentBusiness?.business_name}:

${tickets.map((t, i) => `
Ticket ${i + 1}:
Category: ${t.category}
Subject: ${t.subject}
Description: ${t.description}
Priority: ${t.priority}
Sentiment: ${t.sentiment}
`).join('\n')}

Provide comprehensive analysis:
1. Common Issues (top 5 recurring problems)
2. Feature Requests (what users are asking for)
3. Category Breakdown (percentage by category)
4. Sentiment Overview (overall user satisfaction)
5. Priority Breakdown
6. Recommendations (what to focus on to improve support)`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            common_issues: { type: "array", items: { type: "string" } },
            feature_requests: { type: "array", items: { type: "string" } },
            category_breakdown: { 
              type: "object",
              properties: {
                technical: { type: "number" },
                billing: { type: "number" },
                feature_request: { type: "number" },
                bug_report: { type: "number" },
                general: { type: "number" },
                form_help: { type: "number" }
              }
            },
            sentiment_overview: {
              type: "object",
              properties: {
                positive: { type: "number" },
                neutral: { type: "number" },
                negative: { type: "number" }
              }
            },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      });

      setAnalysis(result);
    } catch (error) {
      console.error('Analysis failed:', error);
    }
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Ticket Insights</h3>
            <p className="text-sm text-zinc-400 mt-1">AI-powered analysis of support trends</p>
          </div>
          <Button
            onClick={analyzeTickets}
            disabled={isAnalyzing || tickets.length === 0}
            className="bg-gradient-to-r from-purple-500 to-pink-600"
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Analyze Tickets
          </Button>
        </div>
      </GlassCard>

      {analysis && (
        <div className="grid lg:grid-cols-2 gap-6">
          <GlassCard className="p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              Common Issues
            </h4>
            <ul className="space-y-2">
              {analysis.common_issues?.map((issue, idx) => (
                <li key={idx} className="text-sm text-zinc-300 flex items-start gap-2">
                  <span className="text-red-400">{idx + 1}.</span>
                  {issue}
                </li>
              ))}
            </ul>
          </GlassCard>

          <GlassCard className="p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Feature Requests
            </h4>
            <ul className="space-y-2">
              {analysis.feature_requests?.map((req, idx) => (
                <li key={idx} className="text-sm text-zinc-300 flex items-start gap-2">
                  <span className="text-emerald-400">•</span>
                  {req}
                </li>
              ))}
            </ul>
          </GlassCard>

          <GlassCard className="p-6">
            <h4 className="font-semibold mb-4">Sentiment Overview</h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-emerald-400">Positive</span>
                  <span>{analysis.sentiment_overview?.positive || 0}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${analysis.sentiment_overview?.positive || 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-400">Neutral</span>
                  <span>{analysis.sentiment_overview?.neutral || 0}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-zinc-500 rounded-full" style={{ width: `${analysis.sentiment_overview?.neutral || 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-red-400">Negative</span>
                  <span>{analysis.sentiment_overview?.negative || 0}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${analysis.sentiment_overview?.negative || 0}%` }} />
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-400" />
              Recommendations
            </h4>
            <ul className="space-y-2">
              {analysis.recommendations?.map((rec, idx) => (
                <li key={idx} className="text-sm text-zinc-300 flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  {rec}
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>
      )}

      {!analysis && !isAnalyzing && tickets.length === 0 && (
        <GlassCard className="p-12 text-center">
          <BarChart3 className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Tickets to Analyze</h3>
          <p className="text-zinc-500">Support tickets will appear here for analysis</p>
        </GlassCard>
      )}
    </div>
  );
}