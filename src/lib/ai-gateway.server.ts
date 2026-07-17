// Server-only Lovable AI Gateway helper.
// Reads LOVABLE_API_KEY inside each caller; do not read at module scope.

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function chat(opts: {
  model?: string;
  messages: ChatMessage[];
  response_format?: { type: "json_object" };
  temperature?: number;
}): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
    },
    body: JSON.stringify({
      model: opts.model ?? "google/gemini-3-flash-preview",
      messages: opts.messages,
      ...(opts.response_format ? { response_format: opts.response_format } : {}),
      ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("Rate limit reached. Please try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted for this workspace.");
    throw new Error(`AI gateway error ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? "";
}
