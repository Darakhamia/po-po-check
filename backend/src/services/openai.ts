import OpenAI from 'openai';
import { prisma } from '../utils/db';

let openaiClient: OpenAI | null = null;

export async function getOpenAIClient(): Promise<OpenAI> {
  if (openaiClient) return openaiClient;

  const setting = await prisma.settings.findUnique({
    where: { key: 'openai_api_key' },
  });

  const apiKey = setting?.value || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

export function resetOpenAIClient() {
  openaiClient = null;
}

export interface TranslateOptions {
  text: string;
  targetLanguage: string;
  context?: string;
  sourceLanguage?: string;
}

export async function translateText(options: TranslateOptions): Promise<string> {
  const client = await getOpenAIClient();
  const { text, targetLanguage, context, sourceLanguage } = options;

  const systemPrompt = `You are a professional translator. Translate the following text to ${targetLanguage}.
Keep the translation accurate and natural-sounding.
Preserve any placeholders like %s, %d, {0}, {{variable}}, etc.
${context ? `Context: ${context}` : ''}
${sourceLanguage ? `Source language: ${sourceLanguage}` : ''}
Return ONLY the translated text, nothing else.`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text },
    ],
    temperature: 0.3,
    max_tokens: 2000,
  });

  return response.choices[0]?.message?.content?.trim() || '';
}

export async function translateBatch(
  entries: { id: string; text: string; context?: string }[],
  targetLanguage: string
): Promise<{ id: string; translation: string }[]> {
  const results = await Promise.all(
    entries.map(async (entry) => {
      try {
        const translation = await translateText({
          text: entry.text,
          targetLanguage,
          context: entry.context,
        });
        return { id: entry.id, translation };
      } catch (error) {
        console.error(`Failed to translate entry ${entry.id}:`, error);
        return { id: entry.id, translation: '' };
      }
    })
  );

  return results;
}
