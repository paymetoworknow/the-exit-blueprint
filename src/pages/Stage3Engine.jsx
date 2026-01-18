import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Rocket, Presentation, Users, Plus, Edit, Trash2,
  Mail, Phone, Building, Calendar, Save, Sparkles,
  ChevronLeft, ChevronRight, Eye, Loader2, UserPlus
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

      const prompt = `Create a 10-slide investor pitch deck for:

Business: ${currentBusiness.business_name}
Tagline: ${currentBusiness.tagline || 'N/A'}
Industry: ${currentBusiness.industry}
Problem: ${currentBusiness.problem_statement || 'N/A'}
Solution: ${currentBusiness.solution || 'N/A'}
Target Customer: ${currentBusiness.target_customer || 'N/A'}
Unique Value: ${currentBusiness.unique_value_prop || 'N/A'}

Market Data:
TAM: ${formatCurrency(currentMarket?.tam)}
SAM: ${formatCurrency(currentMarket?.sam)}
SOM: ${formatCurrency(currentMarket?.som)}
Growth Rate: ${currentMarket?.market_growth_rate || 0}%

Financials:
Monthly Revenue: ${formatCurrency(currentFinancials?.monthly_revenue)}
Annual Revenue: ${formatCurrency(currentFinancials?.annual_revenue)}
Valuation: ${formatCurrency(currentFinancials?.valuation)}
LTV/CAC: ${currentFinancials?.ltv_cac_ratio?.toFixed(2) || 'N/A'}
Customers: ${currentFinancials?.customer_count || 0}

Create compelling slide content for each slide. Include specific numbers and data where available.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
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
                  data_points: { type: "array", items: { type: "object", properties: { label: { type: "string" }, value: { type: "string" } } } },
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