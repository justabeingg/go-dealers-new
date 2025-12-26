import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://afbmpqgyghuccdimacpn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmYm1wcWd5Z2h1Y2NkaW1hY3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMDQ2ODEsImV4cCI6MjA4MTc4MDY4MX0.VBYJOqALBTWSpjSVCmpCRE5o5zbj6e91uWk_wx41yf0';

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
