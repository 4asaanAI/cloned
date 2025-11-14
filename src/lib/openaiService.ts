import { supabase } from './supabase';

export interface OpenAIResponse {
  response: string;
  tokensUsed: number;
}

export async function chatWithOpenAI(
  userMessage: string,
  context?: string
): Promise<OpenAIResponse> {
  const { data, error } = await supabase.functions.invoke('openai-chat', {
    body: {
      userMessage,
      context
    }
  });

  if (error) {
    throw error;
  }

  return {
    response: data.response,
    tokensUsed: data.tokensUsed
  };
}