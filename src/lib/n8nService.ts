export interface N8NResponse {
  response: string;
  success: boolean;
  error?: string;
}

export async function sendQueryToN8N(userQuery: string): Promise<N8NResponse> {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Supabase configuration not found');
    return {
      response: 'Service configuration error. Please contact the administrator.',
      success: false,
      error: 'Missing Supabase configuration'
    };
  }

  const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/n8n-proxy`;

  try {
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        query: userQuery
      })
    });

    if (!response.ok) {
      console.error('Edge function error:', response.status, response.statusText);

      if (response.status === 404) {
        throw new Error('Service endpoint not found');
      } else if (response.status === 401 || response.status === 403) {
        throw new Error('Authentication failed');
      } else if (response.status === 500) {
        throw new Error('Service temporarily unavailable');
      }

      throw new Error(`Service error: ${response.status}`);
    }

    const responseText = await response.text();

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { response: responseText };
    }

    if (data.error) {
      return {
        response: data.error,
        success: false,
        error: data.message || data.error
      };
    }

    const responseContent = data.response || data.answer || data.result || responseText;

    return {
      response: responseContent,
      success: true
    };

  } catch (error) {
    console.error('Error querying N8N via edge function:', error);

    let errorMessage = 'Unable to process your query. Please try again.';

    if (error instanceof TypeError && error.message.includes('fetch')) {
      errorMessage = 'Network error. Please check your connection and try again.';
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      response: errorMessage,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

