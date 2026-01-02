
import { createClient } from '@supabase/supabase-js';

// Khi deploy lên Vercel, hãy thiết lập 2 biến này trong phần Environment Variables của Project Settings
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://yepjpwhppvlbrupsnnsv.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_o32hnM0Q-DHoAo9xvVs6dA_-OZtCn4T';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
