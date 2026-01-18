import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Trash2, AlertTriangle, Loader2, Save, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import GlassCard from '@/components/ui/GlassCard';
import StageHeader from '@/components/ui/StageHeader';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: businesses, isLoading } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => base44.entities.BusinessCore.list('-created_date', 1),
  });

  const currentBusiness = businesses?.[0];

  const deleteMutation = useMutation({
    mutationFn: async () => {
      // Delete all related data
      const [market, brand, financials, leads, docs, decks] = await Promise.all([
        base44.entities.MarketAnalysis.filter({ business_id: currentBusiness.id }),
        base44.entities.BrandAssets.filter({ business_id: currentBusiness.id }),
        base44.entities.Financials.filter({ business_id: currentBusiness.id }),
        base44.entities.CRMLead.filter({ business_id: currentBusiness.id }),
        base44.entities.DueDiligence.filter({ business_id: currentBusiness.id }),
        base44.entities.PitchDeck.filter({ business_id: currentBusiness.id }),
      ]);

      // Delete all related records
      await Promise.all([
        ...market.map(m => base44.entities.MarketAnalysis.delete(m.id)),
        ...brand.map(b => base44.entities.BrandAssets.delete(b.id)),
        ...financials.map(f => base44.entities.Financials.delete(f.id)),
        ...leads.map(l => base44.entities.CRMLead.delete(l.id)),
        ...docs.map(d => base44.entities.DueDiligence.delete(d.id)),
        ...decks.map(d => base44.entities.PitchDeck.delete(d.id)),
      ]);

      // Delete the business
      await base44.entities.BusinessCore.delete(currentBusiness.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      setIsDeleting(false);
      window.location.reload();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <StageHeader
        stageNumber={0}
        title="Settings"
        subtitle="Manage your Exit Blueprint workspace"
        icon={Settings}
        gradient="from-zinc-500 to-zinc-600"
      />

      <div className="space-y-6">
        {/* Current Project */}
        {currentBusiness && (
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-violet-400" />
              Current Project
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-500">Business Name</Label>
                <p className="font-medium mt-1">{currentBusiness.business_name}</p>
              </div>
              <div>
                <Label className="text-zinc-500">Industry</Label>
                <p className="font-medium mt-1 capitalize">{currentBusiness.industry?.replace('_', ' ')}</p>
              </div>
              <div>
                <Label className="text-zinc-500">Current Stage</Label>
                <p className="font-medium mt-1">Stage {currentBusiness.current_stage} of 5</p>
              </div>
              <div>
                <Label className="text-zinc-500">Confidence Score</Label>
                <p className="font-medium mt-1">{currentBusiness.confidence_score || 0}%</p>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Danger Zone */}
        <GlassCard className="p-6 border-red-500/20">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </h3>
          <p className="text-zinc-400 text-sm mb-4">
            Deleting your project will permanently remove all data including market analysis, financials, pitch decks, and documents. This action cannot be undone.
          </p>

          <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
            <DialogTrigger asChild>
              <Button variant="destructive" disabled={!currentBusiness}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Project
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#12121a] border-white/10">
              <DialogHeader>
                <DialogTitle className="text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Delete Project
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-zinc-400">
                  This will permanently delete <span className="text-white font-medium">{currentBusiness?.business_name}</span> and all associated data.
                </p>
                <div>
                  <Label>Type "{currentBusiness?.business_name}" to confirm</Label>
                  <Input
                    value={deleteConfirm}
                    onChange={e => setDeleteConfirm(e.target.value)}
                    className="mt-1.5 bg-white/5 border-white/10"
                    placeholder="Enter business name"
                  />
                </div>
                <Button
                  variant="destructive"
                  className="w-full"
                  disabled={deleteConfirm !== currentBusiness?.business_name || deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate()}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Permanently Delete
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </GlassCard>
      </div>
    </div>
  );
}