import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, ArrowRight, ArrowLeft, Sparkles, 
  Building2, Users, Target, Palette, Rocket,
  Loader2
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import confetti from 'canvas-confetti';

const STEPS = [
  { id: 1, title: 'Business Profile', icon: Building2, description: 'Tell us about your business' },
  { id: 2, title: 'CRM Integration', icon: Users, description: 'Connect your sales tools' },
  { id: 3, title: 'Sales Goals', icon: Target, description: 'Set your targets' },
  { id: 4, title: 'Branding Assets', icon: Palette, description: 'Define your brand identity' }
];

export default function Onboarding() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [ariaMessage, setAriaMessage] = useState('');
  const [isLoadingAria, setIsLoadingAria] = useState(false);

  const { data: existingBusiness } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => base44.entities.BusinessCore.list('-created_date', 1),
  });

  const { data: existingBrand } = useQuery({
    queryKey: ['brand-assets'],
    queryFn: () => base44.entities.BrandAssets.list('-created_date', 1),
  });

  const { data: existingGoals } = useQuery({
    queryKey: ['sales-goals'],
    queryFn: () => base44.entities.SalesGoal.list('-created_date', 1),
  });

  // Check if already onboarded
  useEffect(() => {
    if (existingBusiness?.[0] && existingBrand?.[0] && existingGoals?.length > 0) {
      navigate(createPageUrl('Dashboard'));
    }
  }, [existingBusiness, existingBrand, existingGoals, navigate]);

  // Get Aria's guidance for current step
  const getAriaGuidance = async (step) => {
    setIsLoadingAria(true);
    const prompts = {
      1: "You're welcoming a new user to The Exit Blueprint. They're starting their journey. Give them an encouraging 2-3 sentence welcome message about setting up their business profile. Be warm, professional, and mention you'll guide them through each step.",
      2: "The user is on the CRM integration step. Explain in 2-3 sentences why connecting their CRM (Salesforce or HubSpot) is valuable for tracking sales pipeline and automating investor outreach. Keep it encouraging.",
      3: "The user is setting their first sales goals. In 2-3 sentences, explain why setting measurable goals is crucial for tracking progress and building investor confidence. Be motivating.",
      4: "The user is defining their brand identity. In 2-3 sentences, explain why consistent branding is essential for market presence and investor perception. Keep it inspiring and professional."
    };

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `${prompts[step]}\n\nRemember: You are Aria, the vCOO of The Exit Blueprint. Be professional, encouraging, and concise.`,
        add_context_from_internet: false
      });
      setAriaMessage(result);
    } catch (error) {
      setAriaMessage("Let's keep building your success story together. I'm here to guide you every step of the way.");
    }
    setIsLoadingAria(false);
  };

  useEffect(() => {
    getAriaGuidance(currentStep);
  }, [currentStep]);

  const progress = (currentStep / STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    setTimeout(() => {
      navigate(createPageUrl('Dashboard'));
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
            <Rocket className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome to The Exit Blueprint</h1>
          <p className="text-zinc-400">Let's set up your journey to a successful exit</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {STEPS.map((step) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  currentStep > step.id ? 'bg-emerald-500 text-white' :
                  currentStep === step.id ? 'bg-violet-500 text-white' :
                  'bg-white/10 text-zinc-500'
                }`}>
                  {currentStep > step.id ? <CheckCircle className="w-5 h-5" /> : step.id}
                </div>
                {step.id < STEPS.length && (
                  <div className={`w-16 lg:w-32 h-1 mx-2 rounded transition-all ${
                    currentStep > step.id ? 'bg-emerald-500' : 'bg-white/10'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Aria's Guidance */}
        <GlassCard className="p-6 mb-6 bg-gradient-to-br from-violet-500/10 to-purple-600/10 border-violet-500/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-violet-400 mb-1">Aria, your vCOO</p>
              {isLoadingAria ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                  <p className="text-sm text-zinc-400">Preparing guidance...</p>
                </div>
              ) : (
                <p className="text-sm text-zinc-300">{ariaMessage}</p>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Step Content */}
        <GlassCard className="p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            {React.createElement(STEPS[currentStep - 1].icon, { className: "w-6 h-6 text-violet-400" })}
            <div>
              <h2 className="text-xl font-bold">{STEPS[currentStep - 1].title}</h2>
              <p className="text-sm text-zinc-400">{STEPS[currentStep - 1].description}</p>
            </div>
          </div>

          {currentStep === 1 && <BusinessProfileStep onNext={handleNext} />}
          {currentStep === 2 && <CRMIntegrationStep onNext={handleNext} />}
          {currentStep === 3 && <SalesGoalsStep onNext={handleNext} />}
          {currentStep === 4 && <BrandingAssetsStep onComplete={handleComplete} />}
        </GlassCard>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="border-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-sm text-zinc-500">
            Step {currentStep} of {STEPS.length}
          </div>
        </div>
      </div>
    </div>
  );
}

function BusinessProfileStep({ onNext }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    business_name: '',
    tagline: '',
    industry: 'saas',
    business_model: 'subscription',
    problem_statement: '',
    solution: '',
    unique_value_prop: ''
  });

  const createBusinessMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.BusinessCore.create({
        ...data,
        current_stage: 1,
        confidence_score: 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      onNext();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createBusinessMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Business Name *</Label>
        <Input
          required
          value={formData.business_name}
          onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
          placeholder="e.g., TechFlow Solutions"
          className="mt-2 bg-white/5 border-white/10"
        />
      </div>

      <div>
        <Label>Tagline *</Label>
        <Input
          required
          value={formData.tagline}
          onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
          placeholder="e.g., Streamlining workflows for modern teams"
          className="mt-2 bg-white/5 border-white/10"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div>
          <Label>Industry *</Label>
          <Select value={formData.industry} onValueChange={(val) => setFormData({ ...formData, industry: val })}>
            <SelectTrigger className="mt-2 bg-white/5 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="saas">SaaS</SelectItem>
              <SelectItem value="ecommerce">E-commerce</SelectItem>
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
          <Label>Business Model *</Label>
          <Select value={formData.business_model} onValueChange={(val) => setFormData({ ...formData, business_model: val })}>
            <SelectTrigger className="mt-2 bg-white/5 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="subscription">Subscription</SelectItem>
              <SelectItem value="transactional">Transactional</SelectItem>
              <SelectItem value="marketplace">Marketplace</SelectItem>
              <SelectItem value="advertising">Advertising</SelectItem>
              <SelectItem value="freemium">Freemium</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Problem Statement *</Label>
        <Textarea
          required
          value={formData.problem_statement}
          onChange={(e) => setFormData({ ...formData, problem_statement: e.target.value })}
          placeholder="What problem does your business solve?"
          className="mt-2 bg-white/5 border-white/10 h-20"
        />
      </div>

      <div>
        <Label>Your Solution *</Label>
        <Textarea
          required
          value={formData.solution}
          onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
          placeholder="How do you solve this problem?"
          className="mt-2 bg-white/5 border-white/10 h-20"
        />
      </div>

      <div>
        <Label>Unique Value Proposition</Label>
        <Textarea
          value={formData.unique_value_prop}
          onChange={(e) => setFormData({ ...formData, unique_value_prop: e.target.value })}
          placeholder="What makes you different from competitors?"
          className="mt-2 bg-white/5 border-white/10 h-20"
        />
      </div>

      <Button
        type="submit"
        disabled={createBusinessMutation.isPending}
        className="w-full bg-gradient-to-r from-violet-500 to-purple-600"
      >
        {createBusinessMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Creating Profile...
          </>
        ) : (
          <>
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>
    </form>
  );
}

function CRMIntegrationStep({ onNext }) {
  const [selectedCRM, setSelectedCRM] = useState(null);

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-400">
        Connect your CRM to automatically sync leads and track your sales pipeline. You can skip this step and set it up later.
      </p>

      <div className="grid lg:grid-cols-2 gap-4">
        <GlassCard
          className={`p-6 cursor-pointer transition-all ${
            selectedCRM === 'salesforce' 
              ? 'border-2 border-blue-500 bg-blue-500/10' 
              : 'border border-white/10 hover:border-white/20'
          }`}
          onClick={() => setSelectedCRM('salesforce')}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold">Salesforce</h3>
          </div>
          <p className="text-sm text-zinc-400">
            Sync leads, opportunities, and deals from Salesforce CRM
          </p>
        </GlassCard>

        <GlassCard
          className={`p-6 cursor-pointer transition-all ${
            selectedCRM === 'hubspot' 
              ? 'border-2 border-orange-500 bg-orange-500/10' 
              : 'border border-white/10 hover:border-white/20'
          }`}
          onClick={() => setSelectedCRM('hubspot')}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold">HubSpot</h3>
          </div>
          <p className="text-sm text-zinc-400">
            Sync contacts, deals, and pipeline from HubSpot CRM
          </p>
        </GlassCard>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onNext}
          className="flex-1 border-white/10"
        >
          Skip for Now
        </Button>
        <Button
          onClick={onNext}
          disabled={!selectedCRM}
          className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {selectedCRM && (
        <p className="text-xs text-zinc-500 text-center">
          Note: CRM integration will be configured in Settings after onboarding
        </p>
      )}
    </div>
  );
}

function SalesGoalsStep({ onNext }) {
  const queryClient = useQueryClient();
  const { data: businesses } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => base44.entities.BusinessCore.list('-created_date', 1),
  });

  const [goals, setGoals] = useState([
    { goal_type: 'revenue', target_value: 100000, time_period: 'monthly' },
    { goal_type: 'new_leads', target_value: 50, time_period: 'monthly' },
    { goal_type: 'conversion_rate', target_value: 15, time_period: 'monthly' }
  ]);

  const createGoalsMutation = useMutation({
    mutationFn: async () => {
      const business = businesses?.[0];
      if (!business) return;

      const today = new Date();
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      for (const goal of goals) {
        await base44.entities.SalesGoal.create({
          business_id: business.id,
          ...goal,
          start_date: today.toISOString().split('T')[0],
          end_date: endOfMonth.toISOString().split('T')[0],
          current_value: 0,
          status: 'on_track',
          progress_percentage: 0
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-goals'] });
      onNext();
    }
  });

  const updateGoal = (index, field, value) => {
    const newGoals = [...goals];
    newGoals[index][field] = value;
    setGoals(newGoals);
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-400">
        Set measurable goals to track your progress and demonstrate growth to investors.
      </p>

      <div className="space-y-4">
        {goals.map((goal, index) => (
          <div key={index} className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="grid lg:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs">Goal Type</Label>
                <Select
                  value={goal.goal_type}
                  onValueChange={(val) => updateGoal(index, 'goal_type', val)}
                >
                  <SelectTrigger className="mt-1 bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="new_leads">New Leads</SelectItem>
                    <SelectItem value="conversion_rate">Conversion Rate</SelectItem>
                    <SelectItem value="deal_count">Deal Count</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Target Value</Label>
                <Input
                  type="number"
                  value={goal.target_value}
                  onChange={(e) => updateGoal(index, 'target_value', Number(e.target.value))}
                  className="mt-1 bg-white/5 border-white/10"
                />
              </div>
              <div>
                <Label className="text-xs">Time Period</Label>
                <Select
                  value={goal.time_period}
                  onValueChange={(val) => updateGoal(index, 'time_period', val)}
                >
                  <SelectTrigger className="mt-1 bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button
        onClick={() => createGoalsMutation.mutate()}
        disabled={createGoalsMutation.isPending}
        className="w-full bg-gradient-to-r from-violet-500 to-purple-600"
      >
        {createGoalsMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Setting Goals...
          </>
        ) : (
          <>
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>
    </div>
  );
}

function BrandingAssetsStep({ onComplete }) {
  const queryClient = useQueryClient();
  const { data: businesses } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => base44.entities.BusinessCore.list('-created_date', 1),
  });

  const [formData, setFormData] = useState({
    primary_color: '#8B5CF6',
    secondary_color: '#6366F1',
    accent_color: '#10B981',
    brand_voice: 'professional'
  });

  const createBrandMutation = useMutation({
    mutationFn: async (data) => {
      const business = businesses?.[0];
      if (!business) return;

      return await base44.entities.BrandAssets.create({
        business_id: business.id,
        ...data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-assets'] });
      onComplete();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createBrandMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-sm text-zinc-400">
        Define your brand identity to ensure consistent messaging across all materials.
      </p>

      <div className="grid lg:grid-cols-3 gap-4">
        <div>
          <Label>Primary Color</Label>
          <div className="flex gap-2 mt-2">
            <Input
              type="color"
              value={formData.primary_color}
              onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
              className="w-16 h-10 p-1 bg-white/5 border-white/10"
            />
            <Input
              value={formData.primary_color}
              onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
              className="flex-1 bg-white/5 border-white/10"
            />
          </div>
        </div>

        <div>
          <Label>Secondary Color</Label>
          <div className="flex gap-2 mt-2">
            <Input
              type="color"
              value={formData.secondary_color}
              onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
              className="w-16 h-10 p-1 bg-white/5 border-white/10"
            />
            <Input
              value={formData.secondary_color}
              onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
              className="flex-1 bg-white/5 border-white/10"
            />
          </div>
        </div>

        <div>
          <Label>Accent Color</Label>
          <div className="flex gap-2 mt-2">
            <Input
              type="color"
              value={formData.accent_color}
              onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
              className="w-16 h-10 p-1 bg-white/5 border-white/10"
            />
            <Input
              value={formData.accent_color}
              onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
              className="flex-1 bg-white/5 border-white/10"
            />
          </div>
        </div>
      </div>

      <div>
        <Label>Brand Voice</Label>
        <Select value={formData.brand_voice} onValueChange={(val) => setFormData({ ...formData, brand_voice: val })}>
          <SelectTrigger className="mt-2 bg-white/5 border-white/10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="friendly">Friendly</SelectItem>
            <SelectItem value="bold">Bold</SelectItem>
            <SelectItem value="innovative">Innovative</SelectItem>
            <SelectItem value="trustworthy">Trustworthy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        type="submit"
        disabled={createBrandMutation.isPending}
        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600"
      >
        {createBrandMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Completing Setup...
          </>
        ) : (
          <>
            <CheckCircle className="w-4 h-4 mr-2" />
            Complete Onboarding
          </>
        )}
      </Button>
    </form>
  );
}