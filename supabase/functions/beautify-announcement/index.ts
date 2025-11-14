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
    const { title, content, tone } = await req.json();

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

    if (!title && !content) {
      return new Response(
        JSON.stringify({ beautifiedTitle: "", beautifiedContent: "" }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const systemPrompt = `You are a professional writing assistant that rewrites and "beautifies" short pieces of text (titles and announcements).
Return a JSON object (no extra text) with keys:
{
  "beautifiedTitle": "<title rewritten - concise, natural, title-case>",
  "beautifiedContent": "<content rewritten - improved grammar, clarity, natural tone>"
}
If a field is empty, return it as an empty string. Preserve meaning unless asked to change it. Tone preference: ${tone || "friendly"}.`;

    const userPrompt = [
      `Title: ${title ? `"""${title}"""` : '""'}`,
      `Content: ${content ? `"""${content}"""` : '""'}`,
      `Return only valid JSON with keys beautifiedTitle and beautifiedContent.`,
    ].join("\n");

    const body = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 800,
      top_p: 1,
      n: 1,
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
    const assistantMessage: string | undefined =
      json?.choices?.[0]?.message?.content;

    if (!assistantMessage || typeof assistantMessage !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid response from OpenAI" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const extractJson = (text: string) => {
      const first = text.indexOf("{");
      const last = text.lastIndexOf("}");
      if (first !== -1 && last !== -1 && last > first) {
        const candidate = text.slice(first, last + 1);
        try {
          return JSON.parse(candidate);
        } catch {}
      }
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    };

    const parsed = extractJson(assistantMessage);
    if (!parsed) {
      return new Response(
        JSON.stringify({
          error: "Failed to parse JSON from model response",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const beautifiedTitle =
      typeof parsed.beautifiedTitle === "string"
        ? parsed.beautifiedTitle.trim()
        : typeof parsed.title === "string"
        ? parsed.title.trim()
        : "";

    const beautifiedContent =
      typeof parsed.beautifiedContent === "string"
        ? parsed.beautifiedContent.trim()
        : typeof parsed.content === "string"
        ? parsed.content.trim()
        : "";

    return new Response(
      JSON.stringify({
        beautifiedTitle,
        beautifiedContent,
      }),
      {
        status: 200,
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
