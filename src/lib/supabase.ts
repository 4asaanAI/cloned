import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ContactInquiry {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  created_at?: string;
}

export async function submitContactInquiry(data: Omit<ContactInquiry, 'id' | 'created_at'>) {
  const { data: result, error } = await supabase
    .from('contact_inquiries')
    .insert([data])
    .select()
    .maybeSingle();

  if (error) {
    throw error;
  }

  return result;
}
