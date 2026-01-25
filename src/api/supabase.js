import { createClient } from '@supabase/supabase-js';

// Using Vite environment variables (VITE_ prefix required)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// This creates the actual connection to YOUR database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * This 'supabase' object replaces 'base44' throughout the app.
 * Instead of base44.entities, use supabase.from('table_name').
 */
