import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Building2, Palette, Type, Sparkles, Save, RefreshCw,
  CheckCircle, Clock, FileText, Loader2, Copy, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GlassCard from '@/components/ui/GlassCard';
import StageHeader from '@/components/ui/StageHeader';

const brandVoices = [
  { value: 'professional', label: 'Professional', description: 'Formal, authoritative, trustworthy' },
  { value: 'friendly', label: 'Friendly', description: 'Warm, approachable, conversational' },
  { value: 'bold', label: 'Bold', description: 'Confident, daring, impactful' },
  { value: 'innovative', label: 'Innovative', description: 'Forward-thinking, cutting-edge' },
  { value: 'trustworthy', label: 'Trustworthy', description: 'Reliable, honest, transparent' },
];

const fontPairings = [
  { heading: 'Inter', body: 'Inter', style: 'modern' },
  { heading: 'Playfair Display', body: 'Source Sans Pro', style: 'elegant' },
  { heading: 'Montserrat', body: 'Open Sans', style: 'clean' },
  { heading: 'Poppins', body: 'Roboto', style: 'friendly' },
  { heading: 'DM Sans', body: 'DM Sans', style: 'minimal' },
];

export default function Stage2Architect() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('branding');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedColor, setCopiedColor] = useState(null);

  const { data: businesses, isLoading: loadingBusiness } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => base44.entities.BusinessCore.list('-created_date', 1),
  });

  const { data: brandAssets, isLoading: loadingBrand } = useQuery({
    queryKey: ['brand-assets'],
    queryFn: () => base44.entities.BrandAssets.list('-created_date', 1),
    enabled: !!businesses?.[0],
  });

  const currentBusiness = businesses?.[0];
  const currentBrand = brandAssets?.[0];

  const [brandData, setBrandData] = useState({
    primary_color: '#8B5CF6',
    secondary_color: '#6366F1',
    accent_color: '#10B981',
    background_color: '#0A0A0F',
    text_color: '#FFFFFF',
    heading_font: 'Inter',
    body_font: 'Inter',
    brand_voice: 'professional',
  });

  useEffect(() => {
    if (currentBrand) {
      setBrandData({
        primary_color: currentBrand.primary_color || '#8B5CF6',
        secondary_color: currentBrand.secondary_color || '#6366F1',
        accent_color: currentBrand.accent_color || '#10B981',
        background_color: currentBrand.background_color || '#0A0A0F',
        text_color: currentBrand.text_color || '#FFFFFF',
        heading_font: currentBrand.heading_font || 'Inter',
        body_font: currentBrand.body_font || 'Inter',
        brand_voice: currentBrand.brand_voice || 'professional',
      });
    }
  }, [currentBrand]);

  const generateBrandMutation = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      
      const prompt = `Generate a brand identity for this business:
Name: ${currentBusiness.business_name}
Tagline: ${currentBusiness.tagline || 'N/A'}
Industry: ${currentBusiness.industry}
Target Customer: ${currentBusiness.target_customer || 'General consumers'}
Problem: ${currentBusiness.problem_statement || 'N/A'}

Provide:
1. A color palette (primary, secondary, accent colors as hex codes) that fits the industry and brand personality
2. Recommended font pairing (heading and body fonts)
3. Brand voice recommendation
4. 90-day SOP checklist (10-15 items) for launching this business with task names and descriptions`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            primary_color: { type: "string" },
            secondary_color: { type: "string" },
            accent_color: { type: "string" },
            heading_font: { type: "string" },
            body_font: { type: "string" },
            brand_voice: { type: "string" },
            sop_list: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day: { type: "number" },
                  task: { type: "string" },
                  description: { type: "string" },
                  category: { type: "string" }
                }
              }
            }
          }
        }
      });

      const brandPayload = {
        business_id: currentBusiness.id,
        primary_color: result.primary_color || brandData.primary_color,
        secondary_color: result.secondary_color || brandData.secondary_color,
        accent_color: result.accent_color || brandData.accent_color,
        background_color: brandData.background_color,
        text_color: brandData.text_color,
        heading_font: result.heading_font || 'Inter',
        body_font: result.body_font || 'Inter',
        brand_voice: result.brand_voice || 'professional',
        sop_list: result.sop_list || [],
      };

      if (currentBrand) {
        await base44.entities.BrandAssets.update(currentBrand.id, brandPayload);
      } else {
        await base44.entities.BrandAssets.create(brandPayload);
      }

      // Update business stage
      if (currentBusiness.current_stage < 3) {
        await base44.entities.BusinessCore.update(currentBusiness.id, {
          current_stage: 3,
          stage_completion: { ...currentBusiness.stage_completion, stage2: true }
        });
      }

      return result;
    },
    onSuccess: () => {
      setIsGenerating(false);
      queryClient.invalidateQueries({ queryKey: ['brand-assets'] });
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
    },
    onError: () => setIsGenerating(false),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...brandData,
        business_id: currentBusiness.id,
        sop_list: currentBrand?.sop_list || [],
      };

      if (currentBrand) {
        return base44.entities.BrandAssets.update(currentBrand.id, payload);
      }
      return base44.entities.BrandAssets.create(payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['brand-assets'] }),
  });

  const copyColor = (color) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  if (loadingBusiness || loadingBrand) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <StageHeader
        stageNumber={2}
        title="The Architect"
        subtitle="Build your brand identity and operational foundation"
        icon={Building2}
        gradient="from-blue-500 to-cyan-500"
      >
        <Button 
          variant="outline" 
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="border-white/10 hover:bg-white/5"
        >
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
        <Button
          onClick={() => generateBrandMutation.mutate()}
          disabled={!currentBusiness || isGenerating}
          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Auto-Generate Brand
            </>
          )}
        </Button>
      </StageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="branding" className="data-[state=active]:bg-white/10">
            <Palette className="w-4 h-4 mr-2" />
            Brand Kit
          </TabsTrigger>
          <TabsTrigger value="sops" className="data-[state=active]:bg-white/10">
            <FileText className="w-4 h-4 mr-2" />
            90-Day SOPs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="branding">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Color Palette */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Palette className="w-5 h-5 text-blue-400" />
                Color Palette
              </h3>
              
              <div className="space-y-4">
                {[
                  { key: 'primary_color', label: 'Primary Color' },
                  { key: 'secondary_color', label: 'Secondary Color' },
                  { key: 'accent_color', label: 'Accent Color' },
                  { key: 'background_color', label: 'Background' },
                  { key: 'text_color', label: 'Text Color' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl border border-white/10 cursor-pointer hover:scale-105 transition-transform"
                      style={{ backgroundColor: brandData[item.key] }}
                      onClick={() => copyColor(brandData[item.key])}
                    />
                    <div className="flex-1">
                      <Label className="text-zinc-400">{item.label}</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="color"
                          value={brandData[item.key]}
                          onChange={e => setBrandData(prev => ({ ...prev, [item.key]: e.target.value }))}
                          className="w-8 h-8 rounded cursor-pointer bg-transparent"
                        />
                        <code className="text-sm text-zinc-500 bg-white/5 px-2 py-1 rounded">
                          {brandData[item.key]}
                        </code>
                        <button
                          onClick={() => copyColor(brandData[item.key])}
                          className="p-1 hover:bg-white/10 rounded"
                        >
                          {copiedColor === brandData[item.key] ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-zinc-500" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Preview */}
              <div className="mt-6 p-4 rounded-xl border border-white/10" style={{ backgroundColor: brandData.background_color }}>
                <h4 className="font-semibold mb-2" style={{ color: brandData.primary_color }}>
                  {currentBusiness?.business_name || 'Your Brand'}
                </h4>
                <p className="text-sm mb-3" style={{ color: brandData.text_color }}>
                  {currentBusiness?.tagline || 'Your tagline here'}
                </p>
                <div className="flex gap-2">
                  <button
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                    style={{ backgroundColor: brandData.primary_color }}
                  >
                    Primary
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                    style={{ backgroundColor: brandData.secondary_color }}
                  >
                    Secondary
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                    style={{ backgroundColor: brandData.accent_color }}
                  >
                    Accent
                  </button>
                </div>
              </div>
            </GlassCard>

            {/* Typography & Voice */}
            <div className="space-y-6">
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <Type className="w-5 h-5 text-blue-400" />
                  Typography
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-zinc-400">Font Pairing</Label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {fontPairings.map((pair, idx) => (
                        <button
                          key={idx}
                          onClick={() => setBrandData(prev => ({ 
                            ...prev, 
                            heading_font: pair.heading, 
                            body_font: pair.body 
                          }))}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            brandData.heading_font === pair.heading 
                              ? 'border-blue-500/50 bg-blue-500/10' 
                              : 'border-white/10 hover:border-white/20 bg-white/5'
                          }`}
                        >
                          <p className="font-semibold text-sm">{pair.heading}</p>
                          <p className="text-xs text-zinc-500">{pair.body}</p>
                          <span className="text-xs text-blue-400 mt-1 inline-block">{pair.style}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold mb-4">Brand Voice</h3>
                <div className="space-y-2">
                  {brandVoices.map((voice) => (
                    <button
                      key={voice.value}
                      onClick={() => setBrandData(prev => ({ ...prev, brand_voice: voice.value }))}
                      className={`w-full p-3 rounded-lg border text-left transition-all ${
                        brandData.brand_voice === voice.value
                          ? 'border-blue-500/50 bg-blue-500/10'
                          : 'border-white/10 hover:border-white/20 bg-white/5'
                      }`}
                    >
                      <p className="font-medium">{voice.label}</p>
                      <p className="text-xs text-zinc-500">{voice.description}</p>
                    </button>
                  ))}
                </div>
              </GlassCard>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sops">
          <SOPView sops={currentBrand?.sop_list} businessName={currentBusiness?.business_name} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SOPView({ sops, businessName }) {
  const [completedTasks, setCompletedTasks] = useState([]);

  const toggleTask = (idx) => {
    setCompletedTasks(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  if (!sops || sops.length === 0) {
    return (
      <GlassCard className="p-12 text-center">
        <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No SOPs Generated Yet</h3>
        <p className="text-zinc-500 mb-4">
          Click "Auto-Generate Brand" to create your 90-day operating procedures
        </p>
      </GlassCard>
    );
  }

  // Group SOPs by category or day ranges
  const groupedSops = sops.reduce((acc, sop, idx) => {
    const dayRange = sop.day <= 30 ? 'Days 1-30' : sop.day <= 60 ? 'Days 31-60' : 'Days 61-90';
    if (!acc[dayRange]) acc[dayRange] = [];
    acc[dayRange].push({ ...sop, originalIndex: idx });
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <GlassCard className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-600/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{businessName} - 90 Day Launch Plan</h2>
            <p className="text-zinc-400 text-sm">
              {completedTasks.length} of {sops.length} tasks completed
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-blue-400">
              {Math.round((completedTasks.length / sops.length) * 100)}%
            </p>
            <p className="text-xs text-zinc-500">Progress</p>
          </div>
        </div>
        <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
            style={{ width: `${(completedTasks.length / sops.length) * 100}%` }}
          />
        </div>
      </GlassCard>

      {Object.entries(groupedSops).map(([range, tasks]) => (
        <GlassCard key={range} className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            {range}
          </h3>
          <div className="space-y-3">
            {tasks.map((sop) => (
              <div
                key={sop.originalIndex}
                onClick={() => toggleTask(sop.originalIndex)}
                className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                  completedTasks.includes(sop.originalIndex)
                    ? 'border-emerald-500/30 bg-emerald-500/10'
                    : 'border-white/10 hover:border-white/20 bg-white/5'
                }`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                  completedTasks.includes(sop.originalIndex)
                    ? 'border-emerald-500 bg-emerald-500'
                    : 'border-zinc-600'
                }`}>
                  {completedTasks.includes(sop.originalIndex) && (
                    <CheckCircle className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-400 font-medium">Day {sop.day}</span>
                    {sop.category && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-zinc-400">
                        {sop.category}
                      </span>
                    )}
                  </div>
                  <p className={`font-medium mt-1 ${completedTasks.includes(sop.originalIndex) ? 'line-through text-zinc-500' : ''}`}>
                    {sop.task}
                  </p>
                  <p className="text-sm text-zinc-500 mt-1">{sop.description}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      ))}
    </div>
  );
}