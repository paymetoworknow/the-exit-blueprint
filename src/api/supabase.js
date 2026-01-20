import { createClient } from '@supabase/supabase-js';

// These variables pull from the "Secret Keys" you put in Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// This creates the actual connection to YOUR database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * THE BILLION DOLLAR BRIDGE:
 * This 'supabase' object now replaces 'base44' throughout your app.
 * Instead of base44.storage, you will now use supabase.from('table_name').
 */
