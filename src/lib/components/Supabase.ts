import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL, // Access URL from environment variable
  import.meta.env.VITE_SUPABASE_ANON_KEY  // Access API key from environment variable
);
 