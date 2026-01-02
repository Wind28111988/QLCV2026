
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yepjpwhppvlbrupsnnsv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_o32hnM0Q-DHoAo9xvVs6dA_-OZtCn4T';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
