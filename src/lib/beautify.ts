// src/lib/beautify.ts
// Server-side library function. DO NOT import this into client-bundled code.
// Returns: { beautifiedTitle: string, beautifiedContent: string }

export type BeautifyResult = {
  beautifiedTitle: string;
  beautifiedContent: string;
};

const OPENAI_API_KEY = import.meta.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  // warn but don't throw at module import time; callers will get an error if they try to use it.
  // In production you might throw here to fail early.
  // eslint-disable-next-line no-console
  console.warn('[beautify lib] OPENAI_API_KEY not set in environment');
}

/**
 * Call OpenAI to beautify title & content.
 * @param input - { title, content, tone? }
 */
export async function beautifyText(input: {
  title?: string;
  content?: string;
  tone?: 'friendly' | 'formal' | 'concise' | 'detailed' | string;
}): Promise<BeautifyResult> {
  const { title = '', content = '', tone = 'friendly' } = input;

  if (!OPENAI_API_KEY) {
    throw new Error('Server misconfiguration: OPENAI_API_KEY is not set.');
  }

  if (!title && !content) {
    return { beautifiedTitle: '', beautifiedContent: '' };
  }

  const systemPrompt = `You are a professional writing assistant that rewrites and "beautifies" short pieces of text (titles and announcements).
Return a JSON object (no extra text) with keys:
{
  "beautifiedTitle": "<title rewritten - concise, natural, title-case>",
  "beautifiedContent": "<content rewritten - improved grammar, clarity, natural tone>"
}
If a field is empty, return it as an empty string. Preserve meaning unless asked to change it. Tone preference: ${tone}.`;

  const userPrompt = [
    `Title: ${title ? `"""${title}"""` : '""'}`,
    `Content: ${content ? `"""${content}"""` : '""'}`,
    `Return only valid JSON with keys beautifiedTitle and beautifiedContent.`,
  ].join('\n');

  const body = {
    model: 'gpt-4o-mini', // change if needed / replace with model you have access to
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.6,
    max_tokens: 800,
    top_p: 1,
    n: 1,
  };

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    // try to parse error for clearer message
    let errText = `OpenAI status ${resp.status}`;
    try {
      const errJson = await resp.json();
      errText = errJson?.error?.message || JSON.stringify(errJson);
    } catch {
      try {
        errText = await resp.text();
      } catch {}
    }
    throw new Error(`OpenAI API error: ${errText}`);
  }

  const json = await resp.json();
  const assistantMessage: string | undefined =
    json?.choices?.[0]?.message?.content;

  if (!assistantMessage || typeof assistantMessage !== 'string') {
    throw new Error('Invalid response from OpenAI (no assistant message).');
  }

  // Robust JSON extraction in case model adds backticks or surrounding text
  const extractJson = (text: string) => {
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first !== -1 && last !== -1 && last > first) {
      const candidate = text.slice(first, last + 1);
      try {
        return JSON.parse(candidate);
      } catch {
        // fallback
      }
    }
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  const parsed = extractJson(assistantMessage);
  if (!parsed) {
    // If parse fails, throw so caller can fallback
    throw new Error(
      'Failed to parse JSON from model response: ' + assistantMessage
    );
  }

  const beautifiedTitle =
    typeof parsed.beautifiedTitle === 'string'
      ? parsed.beautifiedTitle.trim()
      : typeof parsed.title === 'string'
      ? parsed.title.trim()
      : '';

  const beautifiedContent =
    typeof parsed.beautifiedContent === 'string'
      ? parsed.beautifiedContent.trim()
      : typeof parsed.content === 'string'
      ? parsed.content.trim()
      : '';

  return {
    beautifiedTitle,
    beautifiedContent,
  };
}
