import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create and export a configured Supabase client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Also export createClient for flexibility if needed
export { createClient };
