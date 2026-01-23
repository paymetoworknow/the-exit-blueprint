import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Shield, FileText, Upload, FolderOpen, Lock, Trash2, CheckCircle, AlertCircle, Clock,
  Building, Users, TrendingUp, DollarSign, Sparkles,
  Loader2, ExternalLink, FileCheck, Briefcase, Brain, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';
import StageHeader from '@/components/ui/StageHeader';

const documentTypes = [
  { value: 'legal', label: 'Legal', icon: FileText },
  { value: 'financial', label: 'Financial', icon: DollarSign },
  { value: 'operational', label: 'Operational', icon: Building },
  { value: 'technical', label: 'Technical', icon: FileCheck },
  { value: 'hr', label: 'HR', icon: Users },
  { value: 'ip', label: 'Intellectual Property', icon: Lock },
  { value: 'contracts', label: 'Contracts', icon: Briefcase },
  { value: 'compliance', label: 'Compliance', icon: Shield },
];

const documentStatuses = {
  pending: { label: 'Pending', color: 'bg-amber-500/20 text-amber-400', icon: Clock },
  uploaded: { label: 'Uploaded', color: 'bg-blue-500/20 text-blue-400', icon: Upload },
  verified: { label: 'Verified', color: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle },
  flagged: { label: 'Flagged', color: 'bg-red-500/20 text-red-400', icon: AlertCircle },
};

const visibilityOptions = [
  { value: 'private', label: 'Private', description: 'Only you' },
  { value: 'investors', label: 'Investors', description: 'Shared with investors' },
  { value: 'acquirers', label: 'Acquirers', description: 'Shared with acquirers' },
  { value: 'public', label: 'Public', description: 'Anyone with link' },
];

export default function Stage5Exit() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('dataroom');
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [executiveSummary, setExecutiveSummary] = useState(null);

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

  const { data: documents } = useQuery({
    queryKey: ['due-diligence'],
    queryFn: () => base44.entities.DueDiligence.list('-created_date'),
    enabled: !!businesses?.[0],
  });

  const currentBusiness = businesses?.[0];
  const currentMarket = marketAnalysis?.[0];
  const currentFinancials = financials?.[0];

  const uploadDocumentMutation = useMutation({
    mutationFn: async (data) => {
      // Analyze document with AI
      let aiAnalysis = null;
      if (data.file_url) {
        try {
          const analysisPrompt = `Analyze this due diligence document and provide:

Document Type: ${data.document_type}
Document Name: ${data.document_name}

1. A brief summary (2-3 sentences) of the document's content
2. Key findings or important information (3-5 bullet points)
3. Potential risks or red flags based on common due diligence issues (list any concerns)
4. Suggested status: "verified" if document appears complete and valid, "flagged" if there are concerns, or "uploaded" if neutral

Common due diligence red flags to look for:
- Missing critical information
- Inconsistent data or discrepancies
- Legal issues or pending litigation
- Financial irregularities
- Compliance violations
- Expired contracts or licenses
- Undisclosed liabilities`;

          const analysis = await base44.integrations.Core.InvokeLLM({
            prompt: analysisPrompt,
            file_urls: [data.file_url],
            response_json_schema: {
              type: "object",
              properties: {
                summary: { type: "string" },
                key_findings: { type: "array", items: { type: "string" } },
                risks: { type: "array", items: { type: "string" } },
                suggested_status: { type: "string" }
              }
            }
          });
          
          aiAnalysis = analysis;
        } catch (error) {
          console.error('AI analysis failed:', error);
        }
      }

      return base44.entities.DueDiligence.create({
        ...data,
        business_id: currentBusiness.id,
        status: aiAnalysis?.suggested_status || 'uploaded',
        notes: aiAnalysis ? `${data.notes ? data.notes + '\n\n' : ''}AI Analysis:\n${aiAnalysis.summary}\n\nKey Findings:\n${aiAnalysis.key_findings?.join('\n')}\n\nRisks:\n${aiAnalysis.risks?.length > 0 ? aiAnalysis.risks.join('\n') : 'No risks identified'}` : data.notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['due-diligence'] });
      setIsUploading(false);
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (id) => base44.entities.DueDiligence.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['due-diligence'] }),
  });

  const generateSummaryMutation = useMutation({
    mutationFn: async () => {
      setIsGeneratingSummary(true);
      
      const formatCurrency = (num) => {
        if (!num) return '$0';
        if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
        if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
        if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
        return `$${num}`;
      };

      const prompt = `Generate a compelling one-page executive summary for potential acquirers:

Business: ${currentBusiness?.business_name}
Industry: ${currentBusiness?.industry}
Problem: ${currentBusiness?.problem_statement || 'N/A'}
Solution: ${currentBusiness?.solution || 'N/A'}
Target Customer: ${currentBusiness?.target_customer || 'N/A'}
Unique Value: ${currentBusiness?.unique_value_prop || 'N/A'}

Market:
TAM: ${formatCurrency(currentMarket?.tam)}
SAM: ${formatCurrency(currentMarket?.sam)}
SOM: ${formatCurrency(currentMarket?.som)}
Growth Rate: ${currentMarket?.market_growth_rate || 0}%
Confidence: ${currentMarket?.market_confidence || 0}%

Financials:
Annual Revenue: ${formatCurrency(currentFinancials?.annual_revenue)}
Monthly Revenue: ${formatCurrency(currentFinancials?.monthly_revenue)}
Valuation: ${formatCurrency(currentFinancials?.valuation)}
LTV/CAC: ${currentFinancials?.ltv_cac_ratio?.toFixed(2) || 'N/A'}
Customers: ${currentFinancials?.customer_count || 0}
Gross Margin: ${currentFinancials?.gross_margin || 70}%

Create:
1. Executive overview paragraph
2. Key investment highlights (3-5 bullet points)
3. Growth trajectory analysis
4. Compelling reasons for acquisition (3-5 points)
5. Risk factors (2-3 points)
6. Recommended asking price range`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            executive_overview: { type: "string" },
            investment_highlights: { type: "array", items: { type: "string" } },
            growth_analysis: { type: "string" },
            acquisition_reasons: { type: "array", items: { type: "string" } },
            risk_factors: { type: "array", items: { type: "string" } },
            asking_price_low: { type: "number" },
            asking_price_high: { type: "number" }
          }
        }
      });

      return result;
    },
    onSuccess: (data) => {
      setIsGeneratingSummary(false);
      setExecutiveSummary(data);
    },
    onError: () => setIsGeneratingSummary(false),
  });

  if (loadingBusiness) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  // Group documents by type
  const groupedDocs = documentTypes.reduce((acc, type) => {
    acc[type.value] = documents?.filter(d => d.document_type === type.value) || [];
    return acc;
  }, {});

  const totalDocs = documents?.length || 0;
  const verifiedDocs = documents?.filter(d => d.status === 'verified').length || 0;

  return (
    <div className="max-w-6xl mx-auto">
      <StageHeader
        stageNumber={5}
        title="The Exit Vault"
        subtitle="Prepare your due diligence package for acquisition"
        icon={Shield}
        gradient="from-rose-500 to-pink-500"
      >
        <Button
          onClick={() => generateSummaryMutation.mutate()}
          disabled={isGeneratingSummary}
          className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
        >
          {isGeneratingSummary ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Summary
            </>
          )}
        </Button>
      </StageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="dataroom" className="data-[state=active]:bg-white/10">
            <FolderOpen className="w-4 h-4 mr-2" />
            Virtual Data Room
          </TabsTrigger>
          <TabsTrigger value="summary" className="data-[state=active]:bg-white/10">
            <FileText className="w-4 h-4 mr-2" />
            Executive Summary
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dataroom">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <GlassCard className="p-4 bg-gradient-to-br from-rose-500/10 to-pink-600/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalDocs}</p>
                  <p className="text-xs text-zinc-500">Total Documents</p>
                </div>
              </div>
            </GlassCard>
            <GlassCard className="p-4 bg-gradient-to-br from-emerald-500/10 to-teal-600/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{verifiedDocs}</p>
                  <p className="text-xs text-zinc-500">Verified</p>
                </div>
              </div>
            </GlassCard>
            <GlassCard className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-600/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalDocs - verifiedDocs}</p>
                  <p className="text-xs text-zinc-500">Pending Review</p>
                </div>
              </div>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{Math.round((verifiedDocs / Math.max(totalDocs, 1)) * 100)}%</p>
                  <p className="text-xs text-zinc-500">Readiness</p>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Upload Button */}
          <div className="flex justify-end mb-6">
            <Dialog open={isUploading} onOpenChange={setIsUploading}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-rose-500 to-pink-500">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#12121a] border-white/10">
                <DialogHeader>
                  <DialogTitle>Upload Document</DialogTitle>
                </DialogHeader>
                <DocumentUploadForm 
                  onSubmit={(data) => uploadDocumentMutation.mutate(data)}
                  isLoading={uploadDocumentMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>

          {/* Document Categories */}
          <div className="grid lg:grid-cols-2 gap-6">
            {documentTypes.map((type) => {
              const Icon = type.icon;
              const docs = groupedDocs[type.value];
              
              return (
                <GlassCard key={type.value} className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-500/20 to-pink-600/20 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-rose-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{type.label}</h3>
                      <p className="text-xs text-zinc-500">{docs.length} documents</p>
                    </div>
                  </div>

                  {docs.length === 0 ? (
                    <div className="p-4 rounded-lg bg-white/5 text-center">
                      <p className="text-sm text-zinc-500">No documents uploaded</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {docs.map((doc) => {
                       const StatusIcon = documentStatuses[doc.status]?.icon || Clock;
                       const hasAIAnalysis = doc.notes?.includes('AI Analysis:');
                       const risks = hasAIAnalysis && doc.notes?.includes('Risks:') 
                         ? doc.notes.split('Risks:')[1]?.split('\n').filter(r => r.trim() && !r.includes('No risks')).length 
                         : 0;

                       return (
                         <div key={doc.id} className="p-3 rounded-lg bg-white/5 group">
                           <div className="flex items-center gap-3">
                             <StatusIcon className={`w-4 h-4 ${documentStatuses[doc.status]?.color.split(' ')[1]}`} />
                             <div className="flex-1 min-w-0">
                               <div className="flex items-center gap-2">
                                 <p className="text-sm font-medium truncate">{doc.document_name}</p>
                                 {hasAIAnalysis && (
                                   <Badge className="bg-violet-500/20 text-violet-400 text-xs" variant="secondary">
                                     <Brain className="w-3 h-3 mr-1" />
                                     AI
                                   </Badge>
                                 )}
                               </div>
                               <div className="flex items-center gap-2 mt-0.5">
                                 <Badge className={documentStatuses[doc.status]?.color} variant="secondary">
                                   {documentStatuses[doc.status]?.label}
                                 </Badge>
                                 <Badge variant="outline" className="border-white/10 text-xs">
                                   {visibilityOptions.find(v => v.value === doc.visibility)?.label}
                                 </Badge>
                                 {risks > 0 && (
                                   <Badge className="bg-red-500/20 text-red-400 text-xs" variant="secondary">
                                     {risks} Risk{risks > 1 ? 's' : ''}
                                   </Badge>
                                 )}
                               </div>
                             </div>
                             <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                               {hasAIAnalysis && (
                                 <Dialog>
                                   <DialogTrigger asChild>
                                     <Button variant="ghost" size="icon" className="h-8 w-8">
                                       <Search className="w-4 h-4" />
                                     </Button>
                                   </DialogTrigger>
                                   <DialogContent className="bg-[#12121a] border-white/10 max-w-2xl">
                                     <DialogHeader>
                                       <DialogTitle>{doc.document_name} - AI Analysis</DialogTitle>
                                     </DialogHeader>
                                     <DocumentAnalysisView document={doc} />
                                   </DialogContent>
                                 </Dialog>
                               )}
                               {doc.file_url && (
                                 <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                   <Button variant="ghost" size="icon" className="h-8 w-8">
                                     <ExternalLink className="w-4 h-4" />
                                   </Button>
                                 </a>
                               )}
                               <Button 
                                 variant="ghost" 
                                 size="icon" 
                                 className="h-8 w-8 text-red-400"
                                 onClick={() => deleteDocumentMutation.mutate(doc.id)}
                               >
                                 <Trash2 className="w-4 h-4" />
                               </Button>
                             </div>
                           </div>
                         </div>
                       );
                      })}
                    </div>
                  )}
                </GlassCard>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="summary">
          <ExecutiveSummaryView 
            summary={executiveSummary} 
            business={currentBusiness}
            financials={currentFinancials}
            market={currentMarket}
            isGenerating={isGeneratingSummary}
            onGenerate={() => generateSummaryMutation.mutate()}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DocumentAnalysisView({ document }) {
  const aiAnalysis = document.notes?.includes('AI Analysis:') ? document.notes : null;
  
  if (!aiAnalysis) {
    return <p className="text-zinc-400">No AI analysis available for this document.</p>;
  }

  const sections = {
    summary: aiAnalysis.split('AI Analysis:')[1]?.split('Key Findings:')[0]?.trim() || '',
    findings: aiAnalysis.split('Key Findings:')[1]?.split('Risks:')[0]?.split('\n').filter(f => f.trim()) || [],
    risks: aiAnalysis.split('Risks:')[1]?.split('\n').filter(r => r.trim() && !r.includes('No risks')) || [],
  };

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
      <div>
        <h3 className="text-sm font-semibold text-zinc-400 mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Summary
        </h3>
        <p className="text-zinc-300 text-sm leading-relaxed">{sections.summary}</p>
      </div>

      {sections.findings.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-zinc-400 mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Key Findings
          </h3>
          <ul className="space-y-2">
            {sections.findings.map((finding, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-zinc-300">
                <span className="text-emerald-400">•</span>
                <span>{finding}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {sections.risks.length > 0 && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <h3 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Potential Risks Identified
          </h3>
          <ul className="space-y-2">
            {sections.risks.map((risk, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-zinc-300">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-2 pt-4 border-t border-white/10">
        <Badge className={documentStatuses[document.status]?.color}>
          {documentStatuses[document.status]?.label}
        </Badge>
        <span className="text-xs text-zinc-500">
          Status automatically assigned by AI analysis
        </span>
      </div>
    </div>
  );
}

function DocumentUploadForm({ onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    document_name: '',
    document_type: 'legal',
    visibility: 'private',
    file_url: '',
    notes: '',
  });

  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploading(true);
    const result = await base44.integrations.Core.UploadFile({ file });
    setFormData(p => ({ ...p, file_url: result.file_url, document_name: p.document_name || file.name }));
    setIsUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Document Name *</Label>
        <Input
          value={formData.document_name}
          onChange={e => setFormData(p => ({ ...p, document_name: e.target.value }))}
          required
          className="mt-1.5 bg-white/5 border-white/10"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Document Type</Label>
          <Select value={formData.document_type} onValueChange={v => setFormData(p => ({ ...p, document_type: v }))}>
            <SelectTrigger className="mt-1.5 bg-white/5 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {documentTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Visibility</Label>
          <Select value={formData.visibility} onValueChange={v => setFormData(p => ({ ...p, visibility: v }))}>
            <SelectTrigger className="mt-1.5 bg-white/5 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {visibilityOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Upload File</Label>
        <div className="mt-1.5 flex items-center gap-3">
          <label className="flex-1 flex items-center justify-center gap-2 p-4 border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:border-white/20 transition-colors">
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
            ) : (
              <>
                <Upload className="w-5 h-5 text-zinc-400" />
                <span className="text-sm text-zinc-400">
                  {formData.file_url ? 'File uploaded' : 'Click to upload'}
                </span>
              </>
            )}
            <input type="file" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
        {formData.file_url && (
          <div className="space-y-1 mt-1">
            <p className="text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              File uploaded successfully
            </p>
            <p className="text-xs text-violet-400 flex items-center gap-1">
              <Brain className="w-3 h-3" />
              AI will analyze this document upon upload
            </p>
          </div>
        )}
      </div>

      <Button 
        type="submit" 
        disabled={isLoading || !formData.document_name}
        className="w-full bg-gradient-to-r from-rose-500 to-pink-500"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            {formData.file_url ? 'Analyzing & Uploading...' : 'Uploading...'}
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Upload & Analyze Document
          </>
        )}
      </Button>
    </form>
  );
}

function ExecutiveSummaryView({ summary, business, financials, market, isGenerating, onGenerate }) {
  const formatCurrency = (num) => {
    if (!num) return '$0';
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
    return `$${num}`;
  };

  if (!summary) {
    return (
      <GlassCard className="p-12 text-center">
        <FileText className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Generate Executive Summary</h3>
        <p className="text-zinc-500 mb-6 max-w-md mx-auto">
          Create a compelling one-page summary for potential acquirers, highlighting your business's strengths and acquisition value.
        </p>
        <Button
          onClick={onGenerate}
          disabled={isGenerating}
          className="bg-gradient-to-r from-rose-500 to-pink-500"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Summary
            </>
          )}
        </Button>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlassCard className="p-8 bg-gradient-to-br from-rose-500/10 to-pink-600/10 border-rose-500/20">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">{business?.business_name}</h1>
          <p className="text-zinc-400">{business?.tagline}</p>
          <Badge className="mt-2 bg-rose-500/20 text-rose-400">
            Confidential Executive Summary
          </Badge>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-xl bg-white/5">
            <p className="text-2xl font-bold text-white">{formatCurrency(financials?.valuation)}</p>
            <p className="text-xs text-zinc-500">Current Valuation</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-white/5">
            <p className="text-2xl font-bold text-white">{formatCurrency(financials?.annual_revenue)}</p>
            <p className="text-xs text-zinc-500">Annual Revenue</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-white/5">
            <p className="text-2xl font-bold text-white">{market?.market_growth_rate || 0}%</p>
            <p className="text-xs text-zinc-500">Market Growth</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-white/5">
            <p className="text-2xl font-bold text-white">{financials?.customer_count || 0}</p>
            <p className="text-xs text-zinc-500">Customers</p>
          </div>
        </div>
      </GlassCard>

      {/* Executive Overview */}
      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Building className="w-5 h-5 text-rose-400" />
          Executive Overview
        </h2>
        <p className="text-zinc-300 leading-relaxed">{summary.executive_overview}</p>
      </GlassCard>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Investment Highlights */}
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Investment Highlights
          </h2>
          <ul className="space-y-3">
            {summary.investment_highlights?.map((highlight, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-zinc-300">{highlight}</span>
              </li>
            ))}
          </ul>
        </GlassCard>

        {/* Acquisition Reasons */}
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-violet-400" />
            Reasons for Acquisition
          </h2>
          <ul className="space-y-3">
            {summary.acquisition_reasons?.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-xs text-violet-400 shrink-0">
                  {idx + 1}
                </span>
                <span className="text-zinc-300">{reason}</span>
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>

      {/* Growth Analysis */}
      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          Growth Trajectory
        </h2>
        <p className="text-zinc-300 leading-relaxed">{summary.growth_analysis}</p>
      </GlassCard>

      {/* Risk Factors */}
      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-400" />
          Risk Factors
        </h2>
        <ul className="space-y-3">
          {summary.risk_factors?.map((risk, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <span className="text-zinc-300">{risk}</span>
            </li>
          ))}
        </ul>
      </GlassCard>

      {/* Asking Price */}
      <GlassCard className="p-8 bg-gradient-to-br from-emerald-500/10 to-teal-600/10 border-emerald-500/20">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Recommended Asking Price Range</h2>
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-emerald-400">{formatCurrency(summary.asking_price_low)}</p>
              <p className="text-xs text-zinc-500">Low</p>
            </div>
            <div className="text-2xl text-zinc-600">—</div>
            <div className="text-center">
              <p className="text-3xl font-bold text-emerald-400">{formatCurrency(summary.asking_price_high)}</p>
              <p className="text-xs text-zinc-500">High</p>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}