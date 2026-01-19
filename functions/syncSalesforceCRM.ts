import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Salesforce access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('salesforce');

    // Fetch Salesforce instance URL from initial auth
    const instanceUrl = Deno.env.get('SALESFORCE_INSTANCE_URL') || 'https://login.salesforce.com';

    // Fetch Leads from Salesforce
    const leadsResponse = await fetch(`${instanceUrl}/services/data/v59.0/query?q=SELECT+Id,Name,Company,Email,Phone,Status,Rating,LeadSource+FROM+Lead+WHERE+IsConverted=false+ORDER+BY+CreatedDate+DESC+LIMIT+100`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!leadsResponse.ok) {
      throw new Error(`Salesforce API error: ${leadsResponse.statusText}`);
    }

    const leadsData = await leadsResponse.json();

    // Fetch Opportunities (Deals)
    const oppsResponse = await fetch(`${instanceUrl}/services/data/v59.0/query?q=SELECT+Id,Name,AccountId,Amount,StageName,Probability,CloseDate+FROM+Opportunity+WHERE+IsClosed=false+ORDER+BY+CreatedDate+DESC+LIMIT+100`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const oppsData = await oppsResponse.json();

    // Get current business
    const businesses = await base44.entities.BusinessCore.list('-created_date', 1);
    const currentBusiness = businesses[0];

    if (!currentBusiness) {
      return Response.json({ error: 'No business found' }, { status: 404 });
    }

    // Sync leads to Exit Blueprint CRM
    const syncedLeads = [];
    for (const lead of leadsData.records || []) {
      const leadData = {
        business_id: currentBusiness.id,
        lead_type: 'customer',
        name: lead.Name,
        company: lead.Company,
        email: lead.Email,
        phone: lead.Phone,
        status: mapSalesforceStatus(lead.Status),
        notes: `Synced from Salesforce - Source: ${lead.LeadSource || 'N/A'}, Rating: ${lead.Rating || 'N/A'}`,
      };

      // Check if lead already exists
      const existing = await base44.asServiceRole.entities.CRMLead.filter({
        email: lead.Email,
        business_id: currentBusiness.id
      });

      if (existing.length === 0) {
        const created = await base44.asServiceRole.entities.CRMLead.create(leadData);
        syncedLeads.push(created);
      }
    }

    // Sync opportunities
    const syncedOpps = [];
    for (const opp of oppsData.records || []) {
      const oppData = {
        business_id: currentBusiness.id,
        lead_type: 'customer',
        name: opp.Name,
        company: opp.Name,
        status: mapSalesforceOppStage(opp.StageName),
        deal_size: opp.Amount || 0,
        notes: `Synced from Salesforce - Stage: ${opp.StageName}, Probability: ${opp.Probability}%, Close Date: ${opp.CloseDate}`,
      };

      const existing = await base44.asServiceRole.entities.CRMLead.filter({
        notes: { $regex: `Salesforce.*${opp.Id}` }
      });

      if (existing.length === 0) {
        const created = await base44.asServiceRole.entities.CRMLead.create(oppData);
        syncedOpps.push(created);
      }
    }

    return Response.json({
      success: true,
      synced_leads: syncedLeads.length,
      synced_opportunities: syncedOpps.length,
      total_synced: syncedLeads.length + syncedOpps.length
    });

  } catch (error) {
    console.error('Salesforce sync error:', error);
    return Response.json({ 
      error: error.message,
      details: 'Failed to sync Salesforce data'
    }, { status: 500 });
  }
});

function mapSalesforceStatus(sfStatus) {
  const statusMap = {
    'Open - Not Contacted': 'new',
    'Working - Contacted': 'contacted',
    'Closed - Converted': 'closed_won',
    'Closed - Not Converted': 'closed_lost',
    'Qualified': 'meeting',
    'Nurturing': 'contacted'
  };
  return statusMap[sfStatus] || 'new';
}

function mapSalesforceOppStage(stage) {
  if (stage?.includes('Closed Won')) return 'closed_won';
  if (stage?.includes('Closed Lost')) return 'closed_lost';
  if (stage?.includes('Negotiation') || stage?.includes('Proposal')) return 'negotiating';
  if (stage?.includes('Qualified') || stage?.includes('Meeting')) return 'meeting';
  return 'contacted';
}