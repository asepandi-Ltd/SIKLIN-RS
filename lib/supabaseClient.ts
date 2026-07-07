import { createClient } from '@supabase/supabase-js';

let supabaseUrlRaw = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
if (supabaseUrlRaw.includes('/rest/v1')) {
  supabaseUrlRaw = supabaseUrlRaw.split('/rest/v1')[0];
}
const supabaseUrl = supabaseUrlRaw;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
