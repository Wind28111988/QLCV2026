
import { createClient } from '@supabase/supabase-js';

/**
 * Safely retrieve environment variables from Vite's import.meta.env.
 * Adds a fallback to avoid "Cannot read properties of undefined" if the env object is missing.
 */
const getEnvVar = (key: string): string | undefined => {
  try {
    // Check if import.meta and import.meta.env exist before accessing properties
    return (import.meta as any)?.env?.[key];
  } catch (error) {
    console.warn(`Could not access environment variable: ${key}`, error);
    return undefined;
  }
};

const SUPABASE_URL = getEnvVar('VITE_SUPABASE_URL') || 'https://yepjpwhppvlbrupsnnsv.supabase.co';
const SUPABASE_ANON_KEY = getEnvVar('VITE_SUPABASE_ANON_KEY') || 'sb_publishable_o32hnM0Q-DHoAo9xvVs6dA_-OZtCn4T';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
