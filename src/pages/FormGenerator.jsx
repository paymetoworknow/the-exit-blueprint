import React, { useState } from 'react';
import { entities, integrations } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { 
  FileText, Sparkles, Loader2, Download, Search, 
  Briefcase, Users, DollarSign, Shield, FileCheck, Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';
import StageHeader from '@/components/ui/StageHeader';

const formCategories = [
  {
    name: 'Legal Documents',
    icon: Shield,
    color: 'from-red-500 to-rose-600',
    forms: [
      { id: 'nda', name: 'Non-Disclosure Agreement (NDA)', description: 'Protect confidential information' },
      { id: 'employment_contract', name: 'Employment Contract', description: 'Standard employee agreement' },
      { id: 'contractor_agreement', name: 'Independent Contractor Agreement', description: 'Freelancer/contractor terms' },
      { id: 'terms_of_service', name: 'Terms of Service', description: 'Website/app terms and conditions' },
      { id: 'privacy_policy', name: 'Privacy Policy', description: 'Data privacy and usage policy' },
      { id: 'partnership_agreement', name: 'Partnership Agreement', description: 'Business partnership terms' },
      { id: 'consulting_agreement', name: 'Consulting Agreement', description: 'Professional services contract' },
      { id: 'shareholder_agreement', name: 'Shareholder Agreement', description: 'Equity ownership terms' },
      { id: 'licensing_agreement', name: 'Licensing Agreement', description: 'IP licensing terms' },
      { id: 'service_agreement', name: 'Service Level Agreement (SLA)', description: 'Service quality commitments' },
      { id: 'franchise_agreement', name: 'Franchise Agreement', description: 'Franchising terms and conditions' },
    ]
  },
  {
    name: 'HR & Operations',
    icon: Users,
    color: 'from-blue-500 to-cyan-600',
    forms: [
      { id: 'offer_letter', name: 'Job Offer Letter', description: 'Formal employment offer' },
      { id: 'performance_review', name: 'Performance Review Form', description: 'Employee evaluation template' },
      { id: 'timesheet', name: 'Timesheet Template', description: 'Weekly time tracking' },
      { id: 'leave_request', name: 'Leave Request Form', description: 'PTO and absence requests' },
      { id: 'onboarding_checklist', name: 'Employee Onboarding Checklist', description: 'New hire onboarding steps' },
      { id: 'termination_letter', name: 'Termination Letter', description: 'Employee separation notice' },
      { id: 'warning_letter', name: 'Warning Letter', description: 'Employee disciplinary action' },
      { id: 'promotion_letter', name: 'Promotion Letter', description: 'Position advancement notice' },
      { id: 'exit_interview', name: 'Exit Interview Form', description: 'Departing employee feedback' },
    ]
  },
  {
    name: 'Financial Forms',
    icon: DollarSign,
    color: 'from-emerald-500 to-teal-600',
    forms: [
      { id: 'invoice', name: 'Invoice Template', description: 'Professional billing document' },
      { id: 'expense_report', name: 'Expense Report', description: 'Employee expense reimbursement' },
      { id: 'purchase_order', name: 'Purchase Order', description: 'Vendor purchase authorization' },
      { id: 'receipt', name: 'Receipt Template', description: 'Payment acknowledgment' },
      { id: 'quote', name: 'Price Quote', description: 'Service/product pricing proposal' },
      { id: 'credit_note', name: 'Credit Note', description: 'Refund or credit memo' },
      { id: 'payment_plan', name: 'Payment Plan Agreement', description: 'Installment payment terms' },
      { id: 'budget_template', name: 'Budget Template', description: 'Financial planning worksheet' },
    ]
  },
  {
    name: 'Business Operations',
    icon: Briefcase,
    color: 'from-violet-500 to-purple-600',
    forms: [
      { id: 'proposal', name: 'Business Proposal', description: 'Client project proposal' },
      { id: 'meeting_minutes', name: 'Meeting Minutes Template', description: 'Document meeting discussions' },
      { id: 'project_brief', name: 'Project Brief', description: 'Project scope and requirements' },
      { id: 'sow', name: 'Statement of Work (SOW)', description: 'Project deliverables and timeline' },
      { id: 'change_order', name: 'Change Order Form', description: 'Project scope modifications' },
      { id: 'project_charter', name: 'Project Charter', description: 'Project authorization document' },
      { id: 'vendor_contract', name: 'Vendor Contract', description: 'Supplier agreement terms' },
      { id: 'rfp', name: 'Request for Proposal (RFP)', description: 'Vendor bid solicitation' },
    ]
  },
  {
    name: 'Compliance & Safety',
    icon: FileCheck,
    color: 'from-amber-500 to-orange-600',
    forms: [
      { id: 'incident_report', name: 'Incident Report', description: 'Workplace incident documentation' },
      { id: 'safety_checklist', name: 'Safety Inspection Checklist', description: 'Workplace safety audit' },
      { id: 'compliance_checklist', name: 'Compliance Checklist', description: 'Regulatory compliance tracking' },
      { id: 'risk_assessment', name: 'Risk Assessment Form', description: 'Identify and evaluate risks' },
      { id: 'data_breach_response', name: 'Data Breach Response Plan', description: 'Security incident protocol' },
    ]
  },
];

export default function FormGenerator() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [generatingForm, setGeneratingForm] = useState(null);
  const [generatedDocument, setGeneratedDocument] = useState(null);

  const { data: businesses } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => entities.BusinessCore.list('-created_date', 1),
  });

  const { data: financials } = useQuery({
    queryKey: ['financials'],
    queryFn: () => entities.Financials.list('-created_date', 1),
  });

  const currentBusiness = businesses?.[0];

  const generateForm = async (form) => {
    setGeneratingForm(form.id);
    setGeneratedDocument(null);

    try {
      const prompt = getFormPrompt(form, currentBusiness, financials?.[0]);
      
      const result = await integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            document_title: { type: "string" },
            document_content: { type: "string" },
            instructions: { type: "string" },
            customization_notes: { type: "array", items: { type: "string" } }
          }
        }
      });

      setGeneratedDocument({
        ...result,
        form_type: form.name,
        form_id: form.id,
        generated_date: new Date().toLocaleDateString()
      });
    } catch (error) {
      console.error('Form generation failed:', error);
      alert('Failed to generate form. Please try again.');
    }

    setGeneratingForm(null);
  };

  const exportDocument = () => {
    if (!generatedDocument) return;

    const fullText = `${generatedDocument.document_title}\nGenerated: ${generatedDocument.generated_date}\n\n${generatedDocument.document_content}\n\n---\nIMPORTANT NOTES:\n${generatedDocument.customization_notes?.join('\n') || ''}\n\nInstructions: ${generatedDocument.instructions}`;

    const blob = new Blob([fullText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedDocument.form_id}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  const filteredCategories = formCategories.map(cat => ({
    ...cat,
    forms: cat.forms.filter(f => 
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.forms.length > 0);

  return (
    <div className="max-w-7xl mx-auto">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-document, .print-document * { visibility: visible; }
          .print-document { position: absolute; left: 0; top: 0; width: 100%; padding: 40px; }
          .no-print { display: none !important; }
        }
      `}</style>
      <StageHeader
        stageNumber="AI"
        title="Form & Document Generator"
        subtitle="Generate customized business forms and legal documents instantly"
        icon={FileText}
        gradient="from-indigo-500 to-blue-600"
      />

      {/* Search */}
      <div className="mb-8">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search forms and documents..."
            className="pl-10 bg-white/5 border-white/10"
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Categories & Forms List */}
        <div className="lg:col-span-2 space-y-6">
          {filteredCategories.map((category) => {
            const Icon = category.icon;
            return (
              <GlassCard key={category.name} className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${category.color} opacity-20 flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold">{category.name}</h3>
                  <Badge variant="outline" className="border-white/10 ml-auto">
                    {category.forms.length}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  {category.forms.map((form) => (
                    <button
                      key={form.id}
                      onClick={() => generateForm(form)}
                      disabled={generatingForm === form.id}
                      className="w-full text-left p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">{form.name}</h4>
                          <p className="text-sm text-zinc-400">{form.description}</p>
                        </div>
                        {generatingForm === form.id ? (
                          <Loader2 className="w-5 h-5 animate-spin text-indigo-400 shrink-0 ml-3" />
                        ) : (
                          <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 ml-3" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </GlassCard>
            );
          })}
        </div>

        {/* Generated Document Preview */}
        <div className="lg:col-span-1">
          {generatedDocument ? (
            <GlassCard className="p-6 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Generated Document</h3>
                <div className="flex gap-2">
                  <Button onClick={() => window.print()} size="sm" className="bg-white/10 hover:bg-white/20 border border-white/20">
                    <Printer className="w-4 h-4" />
                  </Button>
                  <Button onClick={exportDocument} size="sm" className="bg-gradient-to-r from-indigo-500 to-blue-600">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4 print-document">
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Form Type</p>
                  <p className="font-medium">{generatedDocument.form_type}</p>
                </div>

                <div>
                  <p className="text-sm text-zinc-500 mb-1">Document Title</p>
                  <p className="font-medium">{generatedDocument.document_title}</p>
                </div>

                <div className="p-4 rounded-lg bg-white/5 border border-white/10 max-h-96 overflow-y-auto print:max-h-none print:border-0 print:bg-transparent">
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                    <span className="print:hidden">{generatedDocument.document_content.substring(0, 500)}...</span>
                    <span className="hidden print:inline">{generatedDocument.document_content}</span>
                  </p>
                </div>

                {generatedDocument.customization_notes?.length > 0 && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 no-print">
                    <p className="text-xs font-semibold text-amber-400 mb-2">Customization Required:</p>
                    <ul className="space-y-1">
                      {generatedDocument.customization_notes.map((note, idx) => (
                        <li key={idx} className="text-xs text-zinc-300">• {note}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 no-print">
                  <p className="text-xs font-semibold text-blue-400 mb-1">Instructions:</p>
                  <p className="text-xs text-zinc-300">{generatedDocument.instructions}</p>
                </div>
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="p-6 sticky top-4">
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-sm text-zinc-500">
                  Select a form to generate a customized document
                </p>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}

function getFormPrompt(form, business, financials) {
  const baseContext = `Generate a complete, professional ${form.name} for ${business?.business_name || '[Company Name]'}:

BUSINESS DETAILS:
Company Name: ${business?.business_name || '[Company Name]'}
Industry: ${business?.industry || 'N/A'}
Business Model: ${business?.business_model || 'N/A'}

`;

  const prompts = {
    nda: `${baseContext}Create a comprehensive Non-Disclosure Agreement including:
- Parties involved (to be customized)
- Definition of confidential information
- Obligations and restrictions
- Time period and termination clauses
- Governing law
- Standard legal clauses`,

    employment_contract: `${baseContext}Create a complete Employment Contract including:
- Employee and employer details (to be customized)
- Job title and description
- Compensation and benefits
- Work hours and location
- Confidentiality and non-compete clauses
- Termination conditions
- Standard employment terms`,

    contractor_agreement: `${baseContext}Create an Independent Contractor Agreement including:
- Parties and services description
- Payment terms and schedule
- Ownership of work product
- Confidentiality provisions
- Insurance and liability
- Termination clause`,

    terms_of_service: `${baseContext}Create Terms of Service for the business including:
- Service description and scope
- User obligations and conduct
- Payment and refund terms
- Intellectual property rights
- Limitation of liability
- Dispute resolution`,

    privacy_policy: `${baseContext}Create a Privacy Policy including:
- Data collection practices
- Use of collected information
- Data sharing and disclosure
- User rights and choices
- Security measures
- GDPR/CCPA compliance considerations`,

    offer_letter: `${baseContext}Create a Job Offer Letter including:
- Position title and department
- Start date and location
- Compensation package details
- Benefits overview
- Reporting structure
- At-will employment clause
- Acceptance deadline`,

    invoice: `${baseContext}Create an Invoice Template including:
Company: ${business?.business_name}
- Invoice number field
- Date and due date
- Bill to/ship to sections
- Itemized services/products table
- Subtotal, tax, total
- Payment terms and methods
- Company contact information`,

    proposal: `${baseContext}Create a Business Proposal template including:
- Executive summary section
- Problem statement
- Proposed solution
- Scope of work
- Timeline and milestones
- Pricing and payment terms
- Company qualifications
- Next steps`,

    meeting_minutes: `${baseContext}Create a Meeting Minutes template including:
- Meeting details (date, time, location, attendees)
- Agenda items
- Discussion summary section
- Action items with owners
- Decisions made
- Next meeting info`,

    default: `${baseContext}Create a professional ${form.name} document that is comprehensive, legally sound (with standard disclaimers), and ready to customize for specific use cases.`
  };

  return prompts[form.id] || prompts.default + `\n\nInclude all standard sections for this type of document and make it professional and complete.`;
}