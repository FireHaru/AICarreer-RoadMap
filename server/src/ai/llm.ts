import { config } from '../config.js';

export type ChatTurn = { role: 'user' | 'assistant'; content: string };

export function activeProvider(): 'gemini' | 'openai' | null {
  const { provider, geminiKey, openaiKey } = config.ai;
  if (provider === 'gemini' && geminiKey) return 'gemini';
  if (provider === 'openai' && openaiKey) return 'openai';
  if (!provider) {
    if (geminiKey) return 'gemini';
    if (openaiKey) return 'openai';
  }
  return null;
}

const SYSTEM_PROMPT = `You are PathGPT, the assistant inside PathForge, a personalised learning-roadmap platform for university students.
The learner's roadmap is produced by a deterministic engine (career/research → required skills → skill gaps → courses → prerequisites).
Your job is to explain that roadmap, give personalised advice, suggest projects and help adjust the plan.
Rules:
- Ground every answer in the JSON context and the engine analysis you are given. Never invent courses, codes or numbers that are not in the context.
- If you recommend changing the roadmap, explain the trade-off (time saved vs. skills or prerequisites lost).
- Be concise and concrete: short paragraphs, bold key items, numbered steps when giving a plan. Use Markdown.
- You are not a career counsellor or financial advisor; avoid salary or job-market guarantees.
- Always answer in the language named by "responseLanguage" in the context (English or Vietnamese).`;

async function callGemini(system: string, turns: ChatTurn[]): Promise<string> {
  const { geminiKey, geminiModel } = config.ai;
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: turns.map((t) => ({ role: t.role === 'assistant' ? 'model' : 'user', parts: [{ text: t.content }] })),
      generationConfig: { temperature: 0.4, maxOutputTokens: 900 },
    }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data: any = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? '').join('') ?? '';
  if (!text.trim()) throw new Error('Gemini returned an empty answer');
  return text;
}

async function callOpenAI(system: string, turns: ChatTurn[]): Promise<string> {
  const { openaiKey, openaiModel } = config.ai;
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
    body: JSON.stringify({
      model: openaiModel,
      temperature: 0.4,
      max_tokens: 900,
      messages: [{ role: 'system', content: system }, ...turns],
    }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data: any = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? '';
  if (!text.trim()) throw new Error('OpenAI returned an empty answer');
  return text;
}

/** Asks the configured LLM, grounding it with the learner context and the local engine's analysis. */
export async function llmAnswer(provider: 'gemini' | 'openai', context: unknown, engineAnalysis: string, history: ChatTurn[], message: string) {
  const system = `${SYSTEM_PROMPT}\n\nLearner context (JSON):\n${JSON.stringify(context)}\n\nDeterministic engine analysis for the latest question (use it as the factual basis):\n${engineAnalysis}`;
  const turns: ChatTurn[] = [...history.slice(-8), { role: 'user', content: message }];
  return provider === 'gemini' ? callGemini(system, turns) : callOpenAI(system, turns);
}
