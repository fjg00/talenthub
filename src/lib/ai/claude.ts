import Anthropic from "@anthropic-ai/sdk";

export const MODEL = "claude-haiku-4-5-20251001";

let _client: Anthropic | null = null;

export function getAI(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

export async function generateText(
  prompt: string,
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  const response = await getAI().messages.create({
    model: MODEL,
    max_tokens: options.maxTokens ?? 1024,
    temperature: options.temperature ?? 0.3,
    messages: [{ role: "user", content: prompt }],
  });

  const block = response.content[0];
  return block.type === "text" ? block.text.trim() : "";
}
