import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { userMessage, context } = await req.json();

    const OPENAI_API_KEY = Deno.env.get("VITE_OPENAI_API_KEY");

    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const systemPrompt = `You are a helpful assistant for THE AARYANS - an institution of the Vedic Educational Trust, also known as "Chariot of Knowledge". Your role is to answer questions about the school based on the following information:

${context}

Instructions:
- Answer questions clearly and concisely based only on the information provided above
- If asked about something not covered in the information, politely say you don't have that specific information and suggest contacting the school directly at 8126965555, 8126968888 or theaaryansjoya@gmail.com
- Be friendly, helpful, and professional
- Keep responses focused and not too long (2-4 sentences is ideal)
- If asked about admissions, encourage them to book a tour or contact the school
- Use a warm, welcoming tone appropriate for parents and families
- Remember: THE AARYANS is a CBSE affiliated co-educational institution founded on April 13, 2015, located in Prem Nagar, Joya, Amroha (U.P.)`;

    const body = {
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 250,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    };

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      let errText = `OpenAI status ${resp.status}`;
      try {
        const errJson = await resp.json();
        errText = errJson?.error?.message || JSON.stringify(errJson);
      } catch {
        try {
          errText = await resp.text();
        } catch {}
      }
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${errText}` }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const json = await resp.json();

    if (json.choices && json.choices.length > 0 && json.choices[0].message) {
      const response = json.choices[0].message.content.trim();
      return new Response(
        JSON.stringify({ response }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid response format from OpenAI" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
