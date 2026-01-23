import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { entities } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { 
  Lightbulb, Building2, Rocket, Calculator, Shield, 
  ArrowRight, Plus, TrendingUp, Users, DollarSign,
  Target, Sparkles, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import GlassCard from '@/components/ui/GlassCard';
import ConfidenceScore from '@/components/ui/ConfidenceScore';

const stages = [
  { id: 1, name: 'The Oracle', subtitle: 'Ideation & Validation', icon: Lightbulb, page: 'Stage1Oracle', color: 'from-violet-500 to-purple-600', description: 'Validate your business idea with market analysis' },
  { id: 2, name: 'The Architect', subtitle: 'Operational Setup', icon: Building2, page: 'Stage2Architect', color: 'from-blue-500 to-cyan-500', description: 'Build your brand identity and operations' },
  { id: 3, name: 'The Engine', subtitle: 'Growth & Pitching', icon: Rocket, page: 'Stage3Engine', color: 'from-emerald-500 to-teal-500', description: 'Create pitch decks and manage relationships' },
  { id: 4, name: 'The Quant', subtitle: 'Financial Engineering', icon: Calculator, page: 'Stage4Quant', color: 'from-amber-500 to-orange-500', description: 'Model your financials and valuation' },
  { id: 5, name: 'The Exit Vault', subtitle: 'Due Diligence', icon: Shield, page: 'Stage5Exit', color: 'from-rose-500 to-pink-500', description: 'Prepare for acquisition with a data room' },
];

export default function Dashboard() {
  const { data: businesses, isLoading } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => entities.BusinessCore.list('-created_date'),
  });

  const { data: financials } = useQuery({
    queryKey: ['financials'],
    queryFn: () => entities.Financials.list('-created_date', 1),
    enabled: !!businesses?.length,
  });

  const { data: leads } = useQuery({
    queryKey: ['leads'],
    queryFn: () => entities.CRMLead.list(),
    enabled: !!businesses?.length,
  });

  const currentBusiness = businesses?.[0];
  const currentFinancials = financials?.[0];
  const currentStage = currentBusiness?.current_stage || 1;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentBusiness) {
    return <EmptyState />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm text-zinc-400">Active Project</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
            {currentBusiness.business_name}
          </h1>
          <p className="text-zinc-400 mt-1">{currentBusiness.tagline || 'Your journey to a successful exit'}</p>
        </div>
        <Link to={createPageUrl(stages[currentStage - 1].page)}>
          <Button className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/25">
            Continue to Stage {currentStage}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Target}
          label="Confidence Score"
          value={`${currentBusiness.confidence_score || 0}%`}
          trend={currentBusiness.confidence_score >= 50 ? '+' : ''}
          trendColor={currentBusiness.confidence_score >= 50 ? 'text-emerald-400' : 'text-amber-400'}
          gradient="from-violet-500/20 to-purple-600/20"
        />
        <StatCard
          icon={DollarSign}
          label="Monthly Revenue"
          value={`$${(currentFinancials?.monthly_revenue || 0).toLocaleString()}`}
          trend={currentFinancials?.monthly_revenue > 0 ? 'MRR' : ''}
          gradient="from-emerald-500/20 to-teal-600/20"
        />
        <StatCard
          icon={TrendingUp}
          label="Valuation"
          value={`$${((currentFinancials?.valuation || 0) / 1000000).toFixed(1)}M`}
          gradient="from-amber-500/20 to-orange-600/20"
        />
        <StatCard
          icon={Users}
          label="Active Leads"
          value={leads?.length || 0}
          trend={leads?.filter(l => l.status === 'new').length ? `${leads.filter(l => l.status === 'new').length} new` : ''}
          trendColor="text-blue-400"
          gradient="from-blue-500/20 to-cyan-600/20"
        />
      </div>

      {/* Progress & Confidence */}
      <div className="grid lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2 p-6">
          <h2 className="text-lg font-semibold mb-6">Your Exit Journey</h2>
          <div className="space-y-3">
            {stages.map((stage, idx) => {
              const Icon = stage.icon;
              const isActive = stage.id === currentStage;
              const isCompleted = stage.id < currentStage;
              const isLocked = stage.id > currentStage;

              return (
                <Link
                  key={stage.id}
                  to={createPageUrl(stage.page)}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${
                    isActive 
                      ? 'border-violet-500/50 bg-violet-500/10' 
                      : isCompleted 
                        ? 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10' 
                        : 'border-white/5 hover:border-white/10 hover:bg-white/5'
                  } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={e => isLocked && e.preventDefault()}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stage.color} flex items-center justify-center shrink-0 ${isLocked ? 'grayscale' : ''}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{stage.name}</h3>
                      {isCompleted && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400">
                          Complete
                        </span>
                      )}
                      {isActive && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-violet-500/20 text-violet-400 animate-pulse">
                          In Progress
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-500">{stage.description}</p>
                  </div>
                  <ChevronRight className={`w-5 h-5 ${isLocked ? 'text-zinc-600' : 'text-zinc-400'}`} />
                </Link>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard className="p-6 flex flex-col items-center justify-center">
          <h2 className="text-lg font-semibold mb-6">Viability Score</h2>
          <ConfidenceScore score={currentBusiness.confidence_score || 0} size="lg" />
          <p className="text-center text-sm text-zinc-500 mt-4">
            Based on market analysis, financials, and operational readiness
          </p>
        </GlassCard>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickAction
          icon={Lightbulb}
          label="Update Idea"
          to={createPageUrl('Stage1Oracle')}
          color="from-violet-500 to-purple-600"
        />
        <QuickAction
          icon={Calculator}
          label="Update Financials"
          to={createPageUrl('Stage4Quant')}
          color="from-amber-500 to-orange-500"
        />
        <QuickAction
          icon={Rocket}
          label="View Pitch Deck"
          to={createPageUrl('Stage3Engine')}
          color="from-emerald-500 to-teal-500"
        />
        <QuickAction
          icon={Shield}
          label="Data Room"
          to={createPageUrl('Stage5Exit')}
          color="from-rose-500 to-pink-500"
        />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, trend, trendColor = 'text-emerald-400', gradient }) {
  return (
    <GlassCard className={`p-5 bg-gradient-to-br ${gradient}`}>
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <span className={`text-xs font-medium ${trendColor}`}>{trend}</span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-zinc-400 mt-1">{label}</p>
      </div>
    </GlassCard>
  );
}

function QuickAction({ icon: Icon, label, to, color }) {
  return (
    <Link to={to}>
      <GlassCard hover className="p-4 flex items-center gap-3 group">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className="font-medium text-sm">{label}</span>
      </GlassCard>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="max-w-2xl mx-auto text-center py-20">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-6">
        <Sparkles className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-3xl font-bold mb-3">Welcome to Exit Blueprint</h1>
      <p className="text-zinc-400 mb-8 max-w-md mx-auto">
        Your comprehensive platform to build, scale, and successfully exit your business. 
        Start by validating your business idea.
      </p>
      <Link to={createPageUrl('Stage1Oracle')}>
        <Button size="lg" className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/25">
          <Plus className="w-5 h-5 mr-2" />
          Start Your Journey
        </Button>
      </Link>
    </div>
  );
}