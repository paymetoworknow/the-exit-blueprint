import React, { useState } from 'react';
import { entities, integrations } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { 
  Palette, Sparkles, Loader2, Download, Image as ImageIcon,
  Layout, Share2, Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';
import StageHeader from '@/components/ui/StageHeader';

const assetTypes = [
  {
    id: 'logo',
    name: 'Logo Design',
    description: 'Professional AI-generated logos',
    icon: Palette,
    color: 'from-pink-500 to-rose-600',
    variations: 4
  },
  {
    id: 'banner',
    name: 'Website Banner',
    description: 'Hero banners and headers',
    icon: Layout,
    color: 'from-blue-500 to-cyan-600',
    variations: 3
  },
  {
    id: 'social',
    name: 'Social Media Graphics',
    description: 'Instagram, Facebook, LinkedIn posts',
    icon: Share2,
    color: 'from-violet-500 to-purple-600',
    variations: 4
  },
  {
    id: 'mobile',
    name: 'App Icons',
    description: 'iOS and Android app icons',
    icon: Smartphone,
    color: 'from-emerald-500 to-teal-600',
    variations: 3
  },
];

export default function BrandingAssets() {
  const [selectedType, setSelectedType] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generatedAssets, setGeneratedAssets] = useState([]);
  const [prompt, setPrompt] = useState('');

  const { data: businesses } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => entities.BusinessCore.list('-created_date', 1),
  });

  const { data: brandAssets } = useQuery({
    queryKey: ['brand-assets'],
    queryFn: () => entities.BrandAssets.list('-created_date', 1),
  });

  const currentBusiness = businesses?.[0];
  const currentBrand = brandAssets?.[0];

  const generateAsset = async (type) => {
    setGenerating(true);
    setGeneratedAssets([]);
    setSelectedType(type);

    try {
      const basePrompt = getAssetPrompt(type, currentBusiness, currentBrand, prompt);
      const images = [];

      for (let i = 0; i < type.variations; i++) {
        const result = await integrations.Core.GenerateImage({
          prompt: `${basePrompt} Variation ${i + 1}`
        });
        images.push(result.url);
      }

      setGeneratedAssets(images);
    } catch (error) {
      console.error('Asset generation failed:', error);
      alert('Failed to generate assets. Please try again.');
    }

    setGenerating(false);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <StageHeader
        stageNumber="AI"
        title="Branding Asset Generator"
        subtitle="Create professional logos, banners, and social media graphics"
        icon={Palette}
        gradient="from-pink-500 to-rose-600"
      />

      {/* Custom Prompt */}
      <GlassCard className="p-6 mb-8">
        <h3 className="font-semibold mb-4">Customize Your Assets</h3>
        <div className="space-y-4">
          <div>
            <Label>Additional Design Instructions (Optional)</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., minimalist style, blue color scheme, modern tech feel..."
              className="mt-1.5 bg-white/5 border-white/10"
              rows={3}
            />
          </div>
          {currentBusiness && (
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs text-blue-400 mb-1">Brand Context:</p>
              <p className="text-sm text-zinc-300">
                {currentBusiness.business_name} • {currentBusiness.industry} • {currentBrand?.brand_voice || 'Professional'}
              </p>
            </div>
          )}
        </div>
      </GlassCard>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {assetTypes.map((type) => {
          const Icon = type.icon;
          return (
            <GlassCard key={type.id} className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${type.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">{type.name}</h3>
                  <p className="text-sm text-zinc-400 mb-2">{type.description}</p>
                  <Badge variant="outline" className="border-white/10">
                    {type.variations} variations
                  </Badge>
                </div>
              </div>
              <Button
                onClick={() => generateAsset(type)}
                disabled={generating || !currentBusiness}
                className={`w-full bg-gradient-to-r ${type.color}`}
              >
                {generating && selectedType?.id === type.id ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Generate {type.name}
              </Button>
            </GlassCard>
          );
        })}
      </div>

      {/* Generated Assets */}
      {generating && (
        <GlassCard className="p-12 text-center">
          <Loader2 className="w-16 h-16 animate-spin text-pink-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Generating Your Assets...</h3>
          <p className="text-zinc-500">AI is creating {selectedType?.variations} variations</p>
        </GlassCard>
      )}

      {!generating && generatedAssets.length > 0 && (
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold">{selectedType?.name}</h3>
              <p className="text-sm text-zinc-400">Select and download your preferred design</p>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-400">
              {generatedAssets.length} variations
            </Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {generatedAssets.map((asset, idx) => (
              <div key={idx} className="relative group">
                <div className="rounded-xl border border-white/10 overflow-hidden bg-white/5">
                  <img
                    src={asset}
                    alt={`${selectedType?.name} ${idx + 1}`}
                    className="w-full aspect-video object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-3">
                  <Button
                    onClick={() => window.open(asset, '_blank')}
                    size="sm"
                    className="bg-white/20 hover:bg-white/30"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  <Button
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = asset;
                      a.download = `${currentBusiness?.business_name}_${selectedType?.id}_${idx + 1}.png`;
                      a.click();
                    }}
                    size="sm"
                    className="bg-gradient-to-r from-pink-500 to-rose-600"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Badge className="bg-black/60 backdrop-blur-sm">
                    Variation {idx + 1}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-sm text-zinc-300">
              💡 <strong>Tip:</strong> Download multiple variations and test them with your audience. 
              You can regenerate anytime with different prompts for more options.
            </p>
          </div>
        </GlassCard>
      )}

      {!generating && generatedAssets.length === 0 && (
        <GlassCard className="p-12 text-center">
          <Palette className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Ready to Create</h3>
          <p className="text-zinc-500">Select an asset type above to generate AI-powered branding materials</p>
        </GlassCard>
      )}
    </div>
  );
}

function getAssetPrompt(type, business, brand, customPrompt) {
  const baseContext = `${business?.business_name || 'Modern Company'} - ${business?.industry || 'Technology'} industry. Brand voice: ${brand?.brand_voice || 'professional'}. ${customPrompt ? `Style: ${customPrompt}.` : ''}`;

  const prompts = {
    logo: `Professional minimalist logo design for ${baseContext} Clean, scalable vector style. ${brand?.primary_color ? `Primary color: ${brand.primary_color}` : 'Modern color palette'}. No text, pure iconography. High contrast, memorable symbol.`,
    
    banner: `Modern website hero banner for ${baseContext} Professional, engaging, ${brand?.primary_color ? `featuring ${brand.primary_color}` : 'vibrant colors'}. Abstract shapes, clean layout, premium feel. 1920x600px composition.`,
    
    social: `Eye-catching social media post graphic for ${baseContext} Instagram/LinkedIn style. ${brand?.primary_color ? `Brand color ${brand.primary_color}` : 'Bold colors'}. Professional, shareable, attention-grabbing design. 1080x1080px square format.`,
    
    mobile: `Clean modern app icon for ${baseContext} iOS/Android style. Rounded square format. Simple, recognizable symbol. ${brand?.primary_color ? `Using ${brand.primary_color}` : 'Vibrant gradient'}. Professional, scalable design.`
  };

  return prompts[type.id] || `Professional ${type.name} for ${baseContext}`;
}