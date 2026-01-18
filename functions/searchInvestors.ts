import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Simulated investor database
const INVESTOR_DATABASE = [
  {
    id: "inv_001",
    name: "Andreessen Horowitz",
    partner: "Marc Andreessen",
    email: "deals@a16z.com",
    focus_industries: ["saas", "fintech", "enterprise"],
    funding_stages: ["seed", "series_a", "series_b"],
    investment_thesis: "Software is eating the world - we back exceptional founders building transformative tech companies",
    check_size_min: 1000000,
    check_size_max: 50000000,
    portfolio_companies: ["Airbnb", "Coinbase", "GitHub"],
    website: "https://a16z.com",
    location: "Menlo Park, CA"
  },
  {
    id: "inv_002",
    name: "Sequoia Capital",
    partner: "Roelof Botha",
    email: "investments@sequoiacap.com",
    focus_industries: ["saas", "consumer", "healthtech"],
    funding_stages: ["seed", "series_a", "series_b", "series_c"],
    investment_thesis: "We partner with bold founders who want to build legendary companies that define industries",
    check_size_min: 500000,
    check_size_max: 100000000,
    portfolio_companies: ["Stripe", "Zoom", "DoorDash"],
    website: "https://sequoiacap.com",
    location: "Menlo Park, CA"
  },
  {
    id: "inv_003",
    name: "Y Combinator",
    partner: "Garry Tan",
    email: "apply@ycombinator.com",
    focus_industries: ["saas", "ecommerce", "fintech", "marketplace"],
    funding_stages: ["pre_seed", "seed"],
    investment_thesis: "We invest in exceptional founders at the earliest stages and help them build billion-dollar companies",
    check_size_min: 125000,
    check_size_max: 500000,
    portfolio_companies: ["Airbnb", "Stripe", "Reddit"],
    website: "https://ycombinator.com",
    location: "San Francisco, CA"
  },
  {
    id: "inv_004",
    name: "Benchmark",
    partner: "Sarah Tavel",
    email: "team@benchmark.com",
    focus_industries: ["saas", "marketplace", "consumer"],
    funding_stages: ["series_a", "series_b"],
    investment_thesis: "Equal partnerships with extraordinary entrepreneurs building category-defining companies",
    check_size_min: 5000000,
    check_size_max: 30000000,
    portfolio_companies: ["Uber", "Twitter", "Snapchat"],
    website: "https://benchmark.com",
    location: "San Francisco, CA"
  },
  {
    id: "inv_005",
    name: "First Round Capital",
    partner: "Josh Kopelman",
    email: "hello@firstround.com",
    focus_industries: ["saas", "enterprise", "fintech"],
    funding_stages: ["pre_seed", "seed"],
    investment_thesis: "We're the first call for pre-seed and seed stage founders building transformative tech companies",
    check_size_min: 250000,
    check_size_max: 3000000,
    portfolio_companies: ["Uber", "Square", "Notion"],
    website: "https://firstround.com",
    location: "San Francisco, CA"
  },
  {
    id: "inv_006",
    name: "Insight Partners",
    partner: "Jeff Horing",
    email: "contact@insightpartners.com",
    focus_industries: ["saas", "enterprise", "fintech"],
    funding_stages: ["series_b", "series_c", "growth"],
    investment_thesis: "ScaleUp - we partner with high-growth software and internet businesses",
    check_size_min: 10000000,
    check_size_max: 200000000,
    portfolio_companies: ["Twitter", "Shopify", "HelloSign"],
    website: "https://insightpartners.com",
    location: "New York, NY"
  },
  {
    id: "inv_007",
    name: "Accel",
    partner: "Andrew Braccia",
    email: "info@accel.com",
    focus_industries: ["saas", "consumer", "edtech"],
    funding_stages: ["seed", "series_a", "series_b"],
    investment_thesis: "We partner with exceptional teams building world-class products from the earliest stages",
    check_size_min: 1000000,
    check_size_max: 50000000,
    portfolio_companies: ["Facebook", "Slack", "Dropbox"],
    website: "https://accel.com",
    location: "Palo Alto, CA"
  },
  {
    id: "inv_008",
    name: "GV (Google Ventures)",
    partner: "David Krane",
    email: "gv@google.com",
    focus_industries: ["saas", "healthtech", "enterprise"],
    funding_stages: ["seed", "series_a", "series_b"],
    investment_thesis: "We provide venture capital funding to bold new companies with Google's resources",
    check_size_min: 500000,
    check_size_max: 50000000,
    portfolio_companies: ["Uber", "Slack", "Stripe"],
    website: "https://gv.com",
    location: "Mountain View, CA"
  },
  {
    id: "inv_009",
    name: "Tiger Global",
    partner: "Scott Shleifer",
    email: "investments@tigerglobal.com",
    focus_industries: ["saas", "ecommerce", "fintech"],
    funding_stages: ["series_b", "series_c", "growth"],
    investment_thesis: "Global technology investing across consumer internet, software, and fintech",
    check_size_min: 10000000,
    check_size_max: 200000000,
    portfolio_companies: ["Stripe", "Chime", "Peloton"],
    website: "https://tigerglobal.com",
    location: "New York, NY"
  },
  {
    id: "inv_010",
    name: "Index Ventures",
    partner: "Mike Volpi",
    email: "hello@indexventures.com",
    focus_industries: ["saas", "marketplace", "fintech"],
    funding_stages: ["seed", "series_a", "series_b"],
    investment_thesis: "We back exceptional entrepreneurs who are using technology to reshape the world",
    check_size_min: 1000000,
    check_size_max: 30000000,
    portfolio_companies: ["Dropbox", "Slack", "Revolut"],
    website: "https://indexventures.com",
    location: "San Francisco, CA"
  },
  {
    id: "inv_011",
    name: "Lightspeed Venture Partners",
    partner: "Jeremy Liew",
    email: "team@lsvp.com",
    focus_industries: ["saas", "consumer", "enterprise"],
    funding_stages: ["seed", "series_a", "series_b"],
    investment_thesis: "We partner with exceptional founders from ideation to IPO",
    check_size_min: 500000,
    check_size_max: 50000000,
    portfolio_companies: ["Snapchat", "Affirm", "Grubhub"],
    website: "https://lsvp.com",
    location: "Menlo Park, CA"
  },
  {
    id: "inv_012",
    name: "Bessemer Venture Partners",
    partner: "Byron Deeter",
    email: "info@bvp.com",
    focus_industries: ["saas", "healthtech", "fintech"],
    funding_stages: ["seed", "series_a", "series_b"],
    investment_thesis: "We back visionary entrepreneurs who are building category-defining companies",
    check_size_min: 1000000,
    check_size_max: 50000000,
    portfolio_companies: ["Shopify", "Twilio", "LinkedIn"],
    website: "https://bvp.com",
    location: "Menlo Park, CA"
  }
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { industry, funding_stage, min_check_size, search_query } = await req.json();

    // Filter investors based on criteria
    let results = INVESTOR_DATABASE;

    if (industry) {
      results = results.filter(inv => 
        inv.focus_industries.includes(industry)
      );
    }

    if (funding_stage) {
      results = results.filter(inv => 
        inv.funding_stages.includes(funding_stage)
      );
    }

    if (min_check_size) {
      results = results.filter(inv => 
        inv.check_size_max >= min_check_size
      );
    }

    if (search_query) {
      const query = search_query.toLowerCase();
      results = results.filter(inv => 
        inv.name.toLowerCase().includes(query) ||
        inv.partner.toLowerCase().includes(query) ||
        inv.investment_thesis.toLowerCase().includes(query) ||
        inv.portfolio_companies.some(c => c.toLowerCase().includes(query))
      );
    }

    // Add relevance score
    results = results.map(inv => ({
      ...inv,
      relevance_score: Math.floor(Math.random() * 30) + 70 // Simulated relevance 70-100
    }));

    // Sort by relevance
    results.sort((a, b) => b.relevance_score - a.relevance_score);

    return Response.json({
      investors: results,
      total: results.length,
      filters_applied: {
        industry: industry || 'all',
        funding_stage: funding_stage || 'all',
        min_check_size: min_check_size || 0
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});