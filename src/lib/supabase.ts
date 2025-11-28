import { createClient } from '@supabase/supabase-js';

// Use placeholders to prevent build errors. Runtime will fail if these aren't set.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Export a function to get the service role client if needed (for admin tasks)
export const getServiceSupabase = () => {
  if (!supabaseServiceKey) {
    // We throw here because this should only be called in a server context where the key is mandatory
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');
  }
  return createClient(supabaseUrl, supabaseServiceKey);
};
