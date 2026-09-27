import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://hupvhnvztvzqbdhuukpt.supabase.co';
const SUPABASE_ANON_KEY = 'EKHANE_APNAR_ANON_KEY_PASTE_KORUN';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
