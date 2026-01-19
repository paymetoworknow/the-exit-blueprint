import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get HubSpot access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('hubspot');

    // Fetch Contacts from HubSpot
    const contactsResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=100&properties=firstname,lastname,email,phone,company,lifecyclestage', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!contactsResponse.ok) {
      throw new Error(`HubSpot API error: ${contactsResponse.statusText}`);
    }

    const contactsData = await contactsResponse.json();

    // Fetch Deals from HubSpot
    const dealsResponse = await fetch('https://api.hubapi.com/crm/v3/objects/deals?limit=100&properties=dealname,amount,dealstage,closedate,pipeline', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const dealsData = await dealsResponse.json();

    // Get current business
    const businesses = await base44.entities.BusinessCore.list('-created_date', 1);
    const currentBusiness = businesses[0];

    if (!currentBusiness) {
      return Response.json({ error: 'No business found' }, { status: 404 });
    }

    // Sync contacts to Exit Blueprint CRM
    const syncedContacts = [];
    for (const contact of contactsData.results || []) {
      const props = contact.properties;
      const contactData = {
        business_id: currentBusiness.id,
        lead_type: 'customer',
        name: `${props.firstname || ''} ${props.lastname || ''}`.trim() || 'Unknown',
        company: props.company || '',
        email: props.email,
        phone: props.phone || '',
        status: mapHubSpotLifecycle(props.lifecyclestage),
        notes: `Synced from HubSpot - Lifecycle: ${props.lifecyclestage || 'N/A'}`,
      };

      if (!props.email) continue;

      // Check if contact already exists
      const existing = await base44.asServiceRole.entities.CRMLead.filter({
        email: props.email,
        business_id: currentBusiness.id
      });

      if (existing.length === 0) {
        const created = await base44.asServiceRole.entities.CRMLead.create(contactData);
        syncedContacts.push(created);
      }
    }

    // Sync deals
    const syncedDeals = [];
    for (const deal of dealsData.results || []) {
      const props = deal.properties;
      const dealData = {
        business_id: currentBusiness.id,
        lead_type: 'customer',
        name: props.dealname || 'Unnamed Deal',
        company: props.dealname || '',
        status: mapHubSpotDealStage(props.dealstage),
        deal_size: parseFloat(props.amount) || 0,
        notes: `Synced from HubSpot - Stage: ${props.dealstage}, Close Date: ${props.closedate || 'N/A'}`,
      };

      const existing = await base44.asServiceRole.entities.CRMLead.filter({
        notes: { $regex: `HubSpot.*${deal.id}` }
      });

      if (existing.length === 0) {
        const created = await base44.asServiceRole.entities.CRMLead.create(dealData);
        syncedDeals.push(created);
      }
    }

    return Response.json({
      success: true,
      synced_contacts: syncedContacts.length,
      synced_deals: syncedDeals.length,
      total_synced: syncedContacts.length + syncedDeals.length
    });

  } catch (error) {
    console.error('HubSpot sync error:', error);
    return Response.json({ 
      error: error.message,
      details: 'Failed to sync HubSpot data'
    }, { status: 500 });
  }
});

function mapHubSpotLifecycle(lifecycle) {
  const lifecycleMap = {
    'subscriber': 'new',
    'lead': 'new',
    'marketingqualifiedlead': 'contacted',
    'salesqualifiedlead': 'meeting',
    'opportunity': 'negotiating',
    'customer': 'closed_won',
    'evangelist': 'closed_won',
    'other': 'contacted'
  };
  return lifecycleMap[lifecycle?.toLowerCase()] || 'new';
}

function mapHubSpotDealStage(stage) {
  const lowerStage = stage?.toLowerCase() || '';
  if (lowerStage.includes('won') || lowerStage.includes('closed won')) return 'closed_won';
  if (lowerStage.includes('lost') || lowerStage.includes('closed lost')) return 'closed_lost';
  if (lowerStage.includes('contract') || lowerStage.includes('negotiation')) return 'negotiating';
  if (lowerStage.includes('meeting') || lowerStage.includes('qualified')) return 'meeting';
  if (lowerStage.includes('contact')) return 'contacted';
  return 'new';
}