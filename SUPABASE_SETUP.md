# Supabase Database Setup Guide

## Overview

This application requires a Supabase database with specific tables. Follow these steps to set up your database.

## Prerequisites

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project
3. Get your project URL and anon key from Project Settings > API

## Database Schema

Create the following tables in your Supabase database. You can run these SQL commands in the Supabase SQL Editor.

### 1. Business Core Table

```sql
CREATE TABLE business_core (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  tagline TEXT,
  industry TEXT,
  business_model TEXT,
  problem_statement TEXT,
  solution TEXT,
  target_customer TEXT,
  unique_value_prop TEXT,
  current_stage INTEGER DEFAULT 1,
  confidence_score INTEGER DEFAULT 0,
  stage_completion JSONB DEFAULT '{}',
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE business_core ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own data
CREATE POLICY "Users can view own businesses" ON business_core
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own businesses" ON business_core
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own businesses" ON business_core
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own businesses" ON business_core
  FOR DELETE USING (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_business_core_user_id ON business_core(user_id);
CREATE INDEX idx_business_core_created_date ON business_core(created_date DESC);
```

### 2. Financials Table

```sql
CREATE TABLE financials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES business_core(id) ON DELETE CASCADE,
  monthly_revenue NUMERIC DEFAULT 0,
  annual_revenue NUMERIC DEFAULT 0,
  monthly_expenses NUMERIC DEFAULT 0,
  profit_margin NUMERIC DEFAULT 0,
  customer_acquisition_cost NUMERIC DEFAULT 0,
  lifetime_value NUMERIC DEFAULT 0,
  burn_rate NUMERIC DEFAULT 0,
  runway_months INTEGER DEFAULT 0,
  valuation NUMERIC DEFAULT 0,
  revenue_projections JSONB DEFAULT '{}',
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE financials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own financials" ON financials
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own financials" ON financials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own financials" ON financials
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own financials" ON financials
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_financials_user_id ON financials(user_id);
CREATE INDEX idx_financials_business_id ON financials(business_id);
```

### 3. Market Analysis Table

```sql
CREATE TABLE market_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES business_core(id) ON DELETE CASCADE,
  tam NUMERIC,
  tam_rationale TEXT,
  sam NUMERIC,
  sam_rationale TEXT,
  som NUMERIC,
  som_rationale TEXT,
  market_growth_rate NUMERIC,
  market_confidence INTEGER,
  competitors JSONB DEFAULT '[]',
  lean_canvas JSONB DEFAULT '{}',
  swot JSONB DEFAULT '{}',
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE market_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own market analysis" ON market_analysis
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own market analysis" ON market_analysis
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own market analysis" ON market_analysis
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own market analysis" ON market_analysis
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_market_analysis_user_id ON market_analysis(user_id);
CREATE INDEX idx_market_analysis_business_id ON market_analysis(business_id);
```

### 4. CRM Lead Table

```sql
CREATE TABLE crm_lead (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES business_core(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  title TEXT,
  status TEXT DEFAULT 'new',
  source TEXT,
  notes TEXT,
  last_contact_date TIMESTAMPTZ,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE crm_lead ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own leads" ON crm_lead
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own leads" ON crm_lead
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leads" ON crm_lead
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own leads" ON crm_lead
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_crm_lead_user_id ON crm_lead(user_id);
CREATE INDEX idx_crm_lead_business_id ON crm_lead(business_id);
```

### 5. Additional Tables

Create similar tables for:
- `risk_assessment`
- `business_plan`
- `decision_log`
- `pitch_deck`
- `investor`
- `brand_asset`
- `data_room`
- `document`

Use the same pattern as above:
- UUID primary key
- user_id reference with ON DELETE CASCADE
- Row Level Security policies
- Appropriate indexes
- created_date and updated_date timestamps

## Running Migrations

You can either:

1. **Manual Setup**: Copy and paste each SQL block into the Supabase SQL Editor
2. **Migration Files**: Create migration files in a `supabase/migrations/` folder
3. **Supabase CLI**: Use the Supabase CLI to manage migrations

### Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase in your project
supabase init

# Create a new migration
supabase migration new initial_schema

# Edit the migration file and add your SQL
# Then link to your project
supabase link --project-ref your-project-ref

# Push migrations to Supabase
supabase db push
```

## Authentication Setup

The application uses Supabase Auth. Enable the following in your Supabase project:

1. Go to Authentication > Providers
2. Enable Email provider (already enabled by default)
3. (Optional) Enable OAuth providers like Google, GitHub, etc.

## Environment Variables

After setting up Supabase, update your `.env.local`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Testing

After setup, test the connection:

1. Start the dev server: `npm run dev`
2. Try to sign up/login
3. Create a business in Stage 1
4. Verify data appears in Supabase dashboard

## Troubleshooting

**Connection Issues:**
- Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are correct
- Check Supabase project status
- Ensure tables are created with correct names (lowercase with underscores)

**RLS Policy Issues:**
- Make sure Row Level Security is enabled
- Verify policies allow authenticated users to access their own data
- Check that auth.uid() matches user_id in queries

**Data Not Appearing:**
- Check browser console for errors
- Verify RLS policies are correctly configured
- Ensure user is authenticated before querying
