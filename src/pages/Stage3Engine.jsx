import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Rocket, Presentation, Users, Plus, Edit, Trash2,
  Mail, Phone, Building, Calendar, Save, Sparkles,
  ChevronLeft, ChevronRight, Eye, Loader2, UserPlus,
  Search, Send, ExternalLink, TrendingUp, Filter,
  CheckCircle, Globe, DollarSign
} from 'lucide-react';
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

const leadStatuses = [
  { value: 'new', label: 'New', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'contacted', label: 'Contacted', color: 'bg-violet-500/20 text-violet-400' },
  { value: 'meeting', label: 'Meeting', color: 'bg-amber-500/20 text-amber-400' },
  { value: 'negotiating', label: 'Negotiating', color: 'bg-emerald-500/20 text-emerald-400' },
  { value: 'closed_won', label: 'Won', color: 'bg-green-500/20 text-green-400' },
  { value: 'closed_lost', label: 'Lost', color: 'bg-red-500/20 text-red-400' },
];

const leadTypes = [
  { value: 'investor', label: 'Investor' },
  { value: 'customer', label: 'Customer' },
  { value: 'partner', label: 'Partner' },
  { value: 'acquirer', label: 'Acquirer' },
];

export default function Stage3Engine() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('pitch');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [investorSearchResults, setInvestorSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const { data: businesses, isLoading: loadingBusiness } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => base44.entities.BusinessCore.list('-created_date', 1),
  });

  const { data: marketAnalysis } = useQuery({
    queryKey: ['market-analysis'],
    queryFn: () => base44.entities.MarketAnalysis.list('-created_date', 1),
    enabled: !!businesses?.[0],
  });

  const { data: financials } = useQuery({
    queryKey: ['financials'],
    queryFn: () => base44.entities.Financials.list('-created_date', 1),
    enabled: !!businesses?.[0],
  });

  const { data: pitchDecks } = useQuery({
    queryKey: ['pitch-decks'],
    queryFn: () => base44.entities.PitchDeck.list('-created_date', 1),
    enabled: !!businesses?.[0],
  });

  const { data: leads } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.CRMLead.list('-created_date'),
    enabled: !!businesses?.[0],
  });

  const currentBusiness = businesses?.[0];
  const currentMarket = marketAnalysis?.[0];
  const currentFinancials = financials?.[0];
  const currentDeck = pitchDecks?.[0];

  const generateDeckMutation = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      
      const formatCurrency = (num) => {
        if (!num) return '$0';
        if (num >= 1e12) return `$${(num / 1e12).toFixed(1)}T`;
        if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
        if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
        if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
        return `$${num}`;
      };

      // Calculate customer segments from CRM leads
      const customerLeads = leads?.filter(l => l.lead_type === 'customer') || [];
      const investorLeads = leads?.filter(l => l.lead_type === 'investor') || [];
      const totalLeadValue = leads?.reduce((sum, l) => sum + (l.deal_size || 0), 0) || 0;

      // Calculate growth metrics
      const monthlyGrowth = currentFinancials?.monthly_revenue && currentFinancials.customer_count 
        ? ((currentFinancials.monthly_revenue / currentFinancials.customer_count) * 12 / (currentFinancials.arpu || 1)) * 100
        : 0;

      // Get top competitors
      const competitors = currentMarket?.competitors?.slice(0, 3).map(c => c.name).join(', ') || 'Market leaders';

      const prompt = `Create a 10-slide VC-quality investor pitch deck with SPECIFIC data points for ${currentBusiness.business_name}.

BUSINESS CONTEXT:
Name: ${currentBusiness.business_name}
Tagline: ${currentBusiness.tagline || 'N/A'}
Industry: ${currentBusiness.industry}
Business Model: ${currentBusiness.business_model}
Problem: ${currentBusiness.problem_statement}
Solution: ${currentBusiness.solution}
Target Customer: ${currentBusiness.target_customer}
Unique Value Proposition: ${currentBusiness.unique_value_prop}

MARKET DATA (Use these exact numbers):
TAM: ${formatCurrency(currentMarket?.tam)} (Total Addressable Market)
SAM: ${formatCurrency(currentMarket?.sam)} (Serviceable Addressable Market)
SOM: ${formatCurrency(currentMarket?.som)} (Serviceable Obtainable Market)
Market Growth Rate: ${currentMarket?.market_growth_rate || 0}% annually
Market Confidence Score: ${currentMarket?.market_confidence || 0}%
Key Competitors: ${competitors}

FINANCIAL METRICS (Use these exact numbers):
Monthly Recurring Revenue: ${formatCurrency(currentFinancials?.monthly_revenue)}
Annual Revenue: ${formatCurrency(currentFinancials?.annual_revenue)}
Current Valuation: ${formatCurrency(currentFinancials?.valuation)}
LTV/CAC Ratio: ${currentFinancials?.ltv_cac_ratio?.toFixed(2) || 'N/A'}
Customer Lifetime Value: ${formatCurrency(currentFinancials?.ltv)}
Customer Acquisition Cost: ${formatCurrency(currentFinancials?.cac)}
Total Customers: ${currentFinancials?.customer_count || 0}
ARPU: ${formatCurrency(currentFinancials?.arpu || (currentFinancials?.monthly_revenue / Math.max(currentFinancials?.customer_count, 1)))}
Gross Margin: ${currentFinancials?.gross_margin || 70}%
Monthly Burn: ${formatCurrency(currentFinancials?.monthly_burn)}
Runway: ${currentFinancials?.runway_months || 0} months
Churn Rate: ${currentFinancials?.churn_rate || 5}% monthly

TRACTION DATA:
Total Pipeline Value: ${formatCurrency(totalLeadValue)}
Active Customer Leads: ${customerLeads.length}
Investor Conversations: ${investorLeads.length}
Estimated Monthly Growth: ${monthlyGrowth.toFixed(1)}%

SWOT INSIGHTS:
Strengths: ${currentMarket?.swot?.strengths?.join(', ') || 'N/A'}
Opportunities: ${currentMarket?.swot?.opportunities?.join(', ') || 'N/A'}

Create a 10-slide deck with these REQUIRED slides:
1. Cover - Company name, tagline, and one compelling hook
2. Problem - The pain point with market context
3. Solution - How we solve it uniquely
4. Market Opportunity - Use TAM/SAM/SOM data with growth rate
5. Product/Technology - Core offering and differentiation
6. Business Model - Revenue streams and unit economics (LTV/CAC, ARPU, margins)
7. Traction - Real metrics (customers, revenue, pipeline, growth %)
8. Competitive Landscape - Position vs competitors
9. Financial Projections - Current metrics + 3-year forecast based on growth
10. Ask - Funding amount and use of funds

For EACH slide, provide:
- Compelling title and subtitle
- 3-5 bullet points with SPECIFIC data where available
- data_points array with key metrics formatted as {label, value}
- Make slides 4, 6, 7, 9 extremely data-rich with all available numbers`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            slides: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  slide_number: { type: "number" },
                  title: { type: "string" },
                  subtitle: { type: "string" },
                  content: { type: "array", items: { type: "string" } },
                  data_points: { 
                    type: "array", 
                    items: { 
                      type: "object", 
                      properties: { 
                        label: { type: "string" }, 
                        value: { type: "string" } 
                      } 
                    } 
                  },
                  slide_type: { type: "string" }
                }
              }
            }
          }
        }
      });

      const deckPayload = {
        business_id: currentBusiness.id,
        deck_name: `${currentBusiness.business_name} - Investor Deck`,
        slides: result.slides,
        theme: 'dark',
        status: 'draft',
      };

      if (currentDeck) {
        await base44.entities.PitchDeck.update(currentDeck.id, deckPayload);
      } else {
        await base44.entities.PitchDeck.create(deckPayload);
      }

      // Update business stage
      if (currentBusiness.current_stage < 4) {
        await base44.entities.BusinessCore.update(currentBusiness.id, {
          current_stage: 4,
          stage_completion: { ...currentBusiness.stage_completion, stage3: true }
        });
      }

      return result;
    },
    onSuccess: () => {
      setIsGenerating(false);
      queryClient.invalidateQueries({ queryKey: ['pitch-decks'] });
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
    },
    onError: () => setIsGenerating(false),
  });

  if (loadingBusiness) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const slides = currentDeck?.slides || [];

  return (
    <div className="max-w-6xl mx-auto">
      <StageHeader
        stageNumber={3}
        title="The Engine"
        subtitle="Pitch investors and manage your growth pipeline"
        icon={Rocket}
        gradient="from-emerald-500 to-teal-500"
      >
        <Button
          onClick={() => generateDeckMutation.mutate()}
          disabled={!currentBusiness || isGenerating}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Pitch Deck
            </>
          )}
        </Button>
      </StageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="pitch" className="data-[state=active]:bg-white/10">
            <Presentation className="w-4 h-4 mr-2" />
            Pitch Deck
          </TabsTrigger>
          <TabsTrigger value="investors" className="data-[state=active]:bg-white/10">
            <TrendingUp className="w-4 h-4 mr-2" />
            Investor Network
          </TabsTrigger>
          <TabsTrigger value="crm" className="data-[state=active]:bg-white/10">
            <Users className="w-4 h-4 mr-2" />
            Growth CRM
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pitch">
          {slides.length > 0 ? (
            <PitchDeckViewer 
              slides={slides} 
              currentSlide={currentSlide} 
              setCurrentSlide={setCurrentSlide}
              businessName={currentBusiness?.business_name}
            />
          ) : (
            <GlassCard className="p-12 text-center">
              <Presentation className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Pitch Deck Yet</h3>
              <p className="text-zinc-500 mb-6 max-w-md mx-auto">
                Generate your VC-style pitch deck automatically using your business data from previous stages.
              </p>
              <Button
                onClick={() => generateDeckMutation.mutate()}
                disabled={isGenerating}
                className="bg-gradient-to-r from-emerald-500 to-teal-500"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Pitch Deck
              </Button>
            </GlassCard>
          )}
        </TabsContent>

        <TabsContent value="investors">
          <InvestorNetwork 
            businessId={currentBusiness?.id}
            business={currentBusiness}
            pitchDeck={currentDeck}
            queryClient={queryClient}
            searchResults={investorSearchResults}
            setSearchResults={setInvestorSearchResults}
            isSearching={isSearching}
            setIsSearching={setIsSearching}
          />
        </TabsContent>

        <TabsContent value="crm">
          <CRMDashboard 
            leads={leads || []} 
            businessId={currentBusiness?.id}
            queryClient={queryClient}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PitchDeckViewer({ slides, currentSlide, setCurrentSlide, businessName }) {
  const slide = slides[currentSlide];

  const slideGradients = [
    'from-violet-600 to-purple-700',
    'from-blue-600 to-cyan-600',
    'from-emerald-600 to-teal-600',
    'from-amber-600 to-orange-600',
    'from-rose-600 to-pink-600',
    'from-indigo-600 to-violet-600',
    'from-cyan-600 to-blue-600',
    'from-teal-600 to-emerald-600',
    'from-orange-600 to-red-600',
    'from-pink-600 to-rose-600',
  ];

  return (
    <div className="space-y-4">
      {/* Slide Viewer */}
      <GlassCard className="overflow-hidden">
        <div className={`aspect-video bg-gradient-to-br ${slideGradients[currentSlide % slideGradients.length]} p-8 lg:p-12 flex flex-col justify-center relative`}>
          {/* Decorative elements */}
          <div className="absolute top-4 left-4 text-white/20 text-sm font-medium">
            {businessName}
          </div>
          <div className="absolute top-4 right-4 text-white/20 text-sm">
            {currentSlide + 1} / {slides.length}
          </div>
          
          {/* Slide content */}
          <div className="max-w-3xl mx-auto text-center lg:text-left">
            {slide?.subtitle && (
              <p className="text-white/60 text-sm uppercase tracking-wider mb-2">
                {slide.subtitle}
              </p>
            )}
            <h2 className="text-2xl lg:text-4xl font-bold text-white mb-6">
              {slide?.title}
            </h2>
            
            {slide?.content && slide.content.length > 0 && (
              <ul className="space-y-3 text-white/90 text-sm lg:text-base">
                {slide.content.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-white/50 mt-2 shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            )}

            {slide?.data_points && slide.data_points.length > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {slide.data_points.map((dp, idx) => (
                  <div key={idx} className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
                    <p className="text-2xl lg:text-3xl font-bold text-white">{dp.value}</p>
                    <p className="text-xs text-white/60 mt-1">{dp.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
          disabled={currentSlide === 0}
          className="border-white/10 hover:bg-white/5"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <div className="flex gap-1.5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                idx === currentSlide ? 'bg-emerald-500 w-8' : 'bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>

        <Button
          variant="outline"
          onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
          disabled={currentSlide === slides.length - 1}
          className="border-white/10 hover:bg-white/5"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Slide Thumbnails */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {slides.map((s, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`shrink-0 w-32 h-20 rounded-lg overflow-hidden border-2 transition-all ${
              idx === currentSlide ? 'border-emerald-500' : 'border-transparent hover:border-white/20'
            }`}
          >
            <div className={`w-full h-full bg-gradient-to-br ${slideGradients[idx % slideGradients.length]} flex items-center justify-center p-2`}>
              <p className="text-white text-xs font-medium line-clamp-2 text-center">{s.title}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function CRMDashboard({ leads, businessId, queryClient }) {
  const [isAddingLead, setIsAddingLead] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [filter, setFilter] = useState('all');

  const createLeadMutation = useMutation({
    mutationFn: (data) => base44.entities.CRMLead.create({ ...data, business_id: businessId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setIsAddingLead(false);
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CRMLead.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setEditingLead(null);
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: (id) => base44.entities.CRMLead.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
  });

  const filteredLeads = filter === 'all' ? leads : leads.filter(l => l.lead_type === filter);

  // Pipeline stats
  const pipelineStats = leadStatuses.map(status => ({
    ...status,
    count: leads.filter(l => l.status === status.value).length,
    value: leads.filter(l => l.status === status.value).reduce((sum, l) => sum + (l.deal_size || 0), 0),
  }));

  return (
    <div className="space-y-6">
      {/* Pipeline Overview */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {pipelineStats.map((stat) => (
          <GlassCard key={stat.value} className="p-4 text-center">
            <Badge className={`${stat.color} mb-2`}>{stat.label}</Badge>
            <p className="text-2xl font-bold">{stat.count}</p>
            <p className="text-xs text-zinc-500">
              ${(stat.value / 1000).toFixed(0)}K
            </p>
          </GlassCard>
        ))}
      </div>

      {/* Filters & Add Button */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'bg-emerald-500' : 'border-white/10'}
          >
            All
          </Button>
          {leadTypes.map((type) => (
            <Button
              key={type.value}
              variant={filter === type.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(type.value)}
              className={filter === type.value ? 'bg-emerald-500' : 'border-white/10'}
            >
              {type.label}s
            </Button>
          ))}
        </div>

        <Dialog open={isAddingLead} onOpenChange={setIsAddingLead}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-emerald-500 to-teal-500">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#12121a] border-white/10">
            <DialogHeader>
              <DialogTitle>Add New Lead</DialogTitle>
            </DialogHeader>
            <LeadForm 
              onSubmit={(data) => createLeadMutation.mutate(data)}
              isLoading={createLeadMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Leads List */}
      <div className="space-y-3">
        {filteredLeads.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <Users className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Leads Yet</h3>
            <p className="text-zinc-500 mb-4">Start building your pipeline by adding investors, customers, or partners.</p>
          </GlassCard>
        ) : (
          filteredLeads.map((lead) => (
            <GlassCard key={lead.id} className="p-4 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 flex items-center justify-center text-emerald-400 font-bold">
                  {lead.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{lead.name}</h4>
                    <Badge className={leadStatuses.find(s => s.value === lead.status)?.color}>
                      {leadStatuses.find(s => s.value === lead.status)?.label}
                    </Badge>
                    <Badge variant="outline" className="border-white/10 text-xs">
                      {leadTypes.find(t => t.value === lead.lead_type)?.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-zinc-500 mt-1">
                    {lead.company && (
                      <span className="flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        {lead.company}
                      </span>
                    )}
                    {lead.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {lead.email}
                      </span>
                    )}
                    {lead.deal_size > 0 && (
                      <span className="text-emerald-400 font-medium">
                        ${(lead.deal_size / 1000).toFixed(0)}K
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={lead.status}
                    onValueChange={(value) => updateLeadMutation.mutate({ id: lead.id, data: { status: value } })}
                  >
                    <SelectTrigger className="w-32 bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {leadStatuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteLeadMutation.mutate(lead.id)}
                    className="text-zinc-500 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}

function LeadForm({ onSubmit, isLoading, initialData }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    company: initialData?.company || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    lead_type: initialData?.lead_type || 'investor',
    status: initialData?.status || 'new',
    deal_size: initialData?.deal_size || 0,
    notes: initialData?.notes || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Name *</Label>
          <Input
            value={formData.name}
            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
            required
            className="mt-1.5 bg-white/5 border-white/10"
          />
        </div>
        <div>
          <Label>Company</Label>
          <Input
            value={formData.company}
            onChange={e => setFormData(p => ({ ...p, company: e.target.value }))}
            className="mt-1.5 bg-white/5 border-white/10"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Email</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
            className="mt-1.5 bg-white/5 border-white/10"
          />
        </div>
        <div>
          <Label>Phone</Label>
          <Input
            value={formData.phone}
            onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
            className="mt-1.5 bg-white/5 border-white/10"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Lead Type</Label>
          <Select value={formData.lead_type} onValueChange={v => setFormData(p => ({ ...p, lead_type: v }))}>
            <SelectTrigger className="mt-1.5 bg-white/5 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {leadTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Deal Size ($)</Label>
          <Input
            type="number"
            value={formData.deal_size}
            onChange={e => setFormData(p => ({ ...p, deal_size: parseFloat(e.target.value) || 0 }))}
            className="mt-1.5 bg-white/5 border-white/10"
          />
        </div>
      </div>

      <div>
        <Label>Notes</Label>
        <Textarea
          value={formData.notes}
          onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
          className="mt-1.5 bg-white/5 border-white/10"
          rows={3}
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500">
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
        Add Lead
      </Button>
    </form>
  );
}

function InvestorNetwork({ businessId, business, pitchDeck, queryClient, searchResults, setSearchResults, isSearching, setIsSearching }) {
  const [filters, setFilters] = useState({
    industry: business?.industry || '',
    funding_stage: 'seed',
    min_check_size: 0,
    search_query: ''
  });
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [isPitching, setIsPitching] = useState(false);

  const fundingStages = [
    { value: 'pre_seed', label: 'Pre-Seed' },
    { value: 'seed', label: 'Seed' },
    { value: 'series_a', label: 'Series A' },
    { value: 'series_b', label: 'Series B' },
    { value: 'series_c', label: 'Series C' },
    { value: 'growth', label: 'Growth' },
  ];

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const result = await base44.functions.invoke('searchInvestors', filters);
      setSearchResults(result.data.investors || []);
    } catch (error) {
      console.error('Search failed:', error);
    }
    setIsSearching(false);
  };

  const handlePitch = async (investor, customMessage) => {
    if (!investor?.email || !business) {
      alert('Missing required information to send pitch');
      return;
    }

    setIsPitching(true);
    try {
      // Extract pitch deck summary
      const firstSlide = pitchDeck?.slides?.[0];
      const pitchSummary = {
        industry: business?.industry,
        problem: business?.problem_statement,
        solution: business?.solution,
        market_size: `TAM/SAM/SOM Analysis Available`,
        traction: `${firstSlide?.content?.[0] || 'Early traction'}`,
        team: 'Experienced founding team'
      };

      // Send pitch email
      await base44.functions.invoke('sendPitchEmail', {
        investor_email: investor.email,
        investor_name: investor.partner,
        business_name: business?.business_name,
        tagline: business?.tagline,
        pitch_deck_summary: pitchSummary,
        custom_message: customMessage
      });

      // Add to CRM
      await base44.entities.CRMLead.create({
        business_id: businessId,
        name: investor.partner,
        company: investor.name,
        email: investor.email,
        lead_type: 'investor',
        status: 'contacted',
        deal_size: investor.check_size_min,
        notes: `Pitched via Investor Network on ${new Date().toLocaleDateString()}. Investment thesis: ${investor.investment_thesis}`
      });

      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setSelectedInvestor(null);
      alert('Pitch email sent successfully!');
    } catch (error) {
      console.error('Pitch failed:', error);
      alert('Failed to send pitch. Please try again.');
    } finally {
      setIsPitching(false);
    }
  };

  React.useEffect(() => {
    if (business?.industry) {
      handleSearch();
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Search Filters */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5 text-emerald-400" />
          Search Criteria
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div>
            <Label className="text-zinc-400">Industry</Label>
            <Select 
              value={filters.industry} 
              onValueChange={v => setFilters(p => ({ ...p, industry: v }))}
            >
              <SelectTrigger className="mt-1.5 bg-white/5 border-white/10">
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="saas">SaaS</SelectItem>
                <SelectItem value="ecommerce">E-Commerce</SelectItem>
                <SelectItem value="fintech">FinTech</SelectItem>
                <SelectItem value="healthtech">HealthTech</SelectItem>
                <SelectItem value="edtech">EdTech</SelectItem>
                <SelectItem value="marketplace">Marketplace</SelectItem>
                <SelectItem value="consumer">Consumer</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-zinc-400">Funding Stage</Label>
            <Select 
              value={filters.funding_stage} 
              onValueChange={v => setFilters(p => ({ ...p, funding_stage: v }))}
            >
              <SelectTrigger className="mt-1.5 bg-white/5 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fundingStages.map(stage => (
                  <SelectItem key={stage.value} value={stage.value}>{stage.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-zinc-400">Min Check Size ($)</Label>
            <Input
              type="number"
              value={filters.min_check_size}
              onChange={e => setFilters(p => ({ ...p, min_check_size: parseFloat(e.target.value) || 0 }))}
              className="mt-1.5 bg-white/5 border-white/10"
              placeholder="0"
            />
          </div>

          <div>
            <Label className="text-zinc-400">Search</Label>
            <div className="flex gap-2 mt-1.5">
              <Input
                value={filters.search_query}
                onChange={e => setFilters(p => ({ ...p, search_query: e.target.value }))}
                className="bg-white/5 border-white/10"
                placeholder="Name, portfolio..."
              />
              <Button 
                onClick={handleSearch}
                disabled={isSearching}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 shrink-0"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Results Summary */}
      {searchResults.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-400">
            Found <span className="text-white font-medium">{searchResults.length}</span> matching investors
          </p>
          <Badge className="bg-emerald-500/20 text-emerald-400">
            {filters.industry.toUpperCase()} • {filters.funding_stage.replace('_', '-').toUpperCase()}
          </Badge>
        </div>
      )}

      {/* Investor Cards */}
      <div className="grid lg:grid-cols-2 gap-4">
        {isSearching ? (
          <div className="col-span-2 flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : searchResults.length === 0 ? (
          <GlassCard className="col-span-2 p-12 text-center">
            <Search className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Investors Found</h3>
            <p className="text-zinc-500">Try adjusting your search criteria</p>
          </GlassCard>
        ) : (
          searchResults.map((investor) => (
            <GlassCard key={investor.id} className="p-5 hover:bg-white/5 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-lg flex items-center gap-2">
                    {investor.name}
                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-xs">
                      {investor.relevance_score}% match
                    </Badge>
                  </h4>
                  <p className="text-sm text-zinc-400">{investor.partner}</p>
                </div>
                <a 
                  href={investor.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <p className="text-sm text-zinc-400 mb-3 line-clamp-2">
                {investor.investment_thesis}
              </p>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="p-2 rounded-lg bg-white/5">
                  <p className="text-xs text-zinc-500">Check Size</p>
                  <p className="text-sm font-medium">
                    ${(investor.check_size_min / 1000000).toFixed(1)}M - ${(investor.check_size_max / 1000000).toFixed(0)}M
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-white/5">
                  <p className="text-xs text-zinc-500">Location</p>
                  <p className="text-sm font-medium">{investor.location}</p>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-xs text-zinc-500 mb-1">Portfolio</p>
                <div className="flex flex-wrap gap-1">
                  {investor.portfolio_companies.slice(0, 3).map((company, idx) => (
                    <Badge key={idx} variant="outline" className="border-white/10 text-xs">
                      {company}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500"
                      onClick={() => setSelectedInvestor(investor)}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Pitch
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#12121a] border-white/10 max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Send Pitch to {investor.name}</DialogTitle>
                    </DialogHeader>
                    <PitchDialog 
                      investor={investor}
                      business={business}
                      onSend={handlePitch}
                      isPitching={isPitching}
                    />
                  </DialogContent>
                </Dialog>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-white/10"
                  onClick={async () => {
                    await base44.entities.CRMLead.create({
                      business_id: businessId,
                      name: investor.partner,
                      company: investor.name,
                      email: investor.email,
                      lead_type: 'investor',
                      status: 'new',
                      deal_size: investor.check_size_min,
                      notes: `Added from Investor Network. ${investor.investment_thesis}`
                    });
                    queryClient.invalidateQueries({ queryKey: ['leads'] });
                  }}
                >
                  <UserPlus className="w-4 h-4" />
                </Button>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}

function PitchDialog({ investor, business, onSend, isPitching }) {
  const [customMessage, setCustomMessage] = useState('');
  const [emailPreview, setEmailPreview] = useState(true);

  const defaultMessage = `I've been following ${investor.name}'s portfolio and believe ${business?.business_name} aligns perfectly with your investment thesis in ${business?.industry}. We're solving a critical problem in this space with proven early traction.`;

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-emerald-400">What happens when you pitch:</p>
            <ul className="text-sm text-zinc-400 mt-2 space-y-1">
              <li>• Professional email sent to {investor.partner} at {investor.email}</li>
              <li>• Investor automatically added to your CRM as "Contacted"</li>
              <li>• Pitch includes your business summary and key metrics</li>
              <li>• Outreach logged with timestamp for follow-up tracking</li>
            </ul>
          </div>
        </div>
      </div>

      <div>
        <Label className="text-zinc-400">Investor Details</Label>
        <div className="mt-2 p-3 rounded-lg bg-white/5 space-y-1">
          <p className="font-medium">{investor.name}</p>
          <p className="text-sm text-zinc-400">{investor.partner} • {investor.email}</p>
          <p className="text-sm text-zinc-500 line-clamp-2">{investor.investment_thesis}</p>
        </div>
      </div>

      <div>
        <Label className="text-zinc-400">Custom Message (Optional)</Label>
        <Textarea
          value={customMessage}
          onChange={e => setCustomMessage(e.target.value)}
          placeholder={defaultMessage}
          className="mt-1.5 bg-white/5 border-white/10 min-h-[100px]"
        />
        <p className="text-xs text-zinc-500 mt-1">
          Add a personal touch. Default message will be used if blank.
        </p>
      </div>

      {emailPreview && (
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <p className="text-xs text-zinc-500 mb-2">EMAIL PREVIEW</p>
          <div className="text-sm text-zinc-300 space-y-2">
            <p><strong>To:</strong> {investor.email}</p>
            <p><strong>Subject:</strong> Investment Opportunity: {business?.business_name}</p>
            <div className="pt-2 border-t border-white/10 text-xs">
              <p>Dear {investor.partner},</p>
              <p className="mt-2">{customMessage || defaultMessage}</p>
              <p className="mt-2 text-zinc-500">
                [Key highlights and metrics will be included automatically]
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          onClick={() => onSend(investor, customMessage || defaultMessage)}
          disabled={isPitching}
          className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500"
        >
          {isPitching ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Sending Pitch...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send Pitch Email
            </>
          )}
        </Button>
      </div>
    </div>
  );
}