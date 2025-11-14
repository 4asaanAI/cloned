import { supabase } from './supabase';

export async function getUserTokens(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('profiles')
    .select('chatbot_tokens')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data?.chatbot_tokens || 0;
}

export async function deductTokens(userId: string, tokensUsed: number): Promise<number> {
  const { data, error } = await supabase.rpc('deduct_chatbot_tokens', {
    user_id: userId,
    tokens_to_deduct: tokensUsed,
  });

  if (error) {
    console.error('Error deducting tokens:', error);
    throw error;
  }

  return data;
}

export async function addTokens(userId: string, tokensToAdd: number): Promise<number> {
  const currentTokens = await getUserTokens(userId);
  const newTokens = currentTokens + tokensToAdd;

  const { error } = await supabase
    .from('profiles')
    .update({ chatbot_tokens: newTokens })
    .eq('id', userId);

  if (error) throw error;
  return newTokens;
}
