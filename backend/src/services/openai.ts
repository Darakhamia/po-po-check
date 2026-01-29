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

  const systemPrompt = `You are a professional translator for software localization. Translate the following text to ${targetLanguage}.

CRITICAL FORMATTING RULES - YOU MUST FOLLOW THESE EXACTLY:
1. If the original text does NOT end with a period/punctuation, do NOT add one to the translation
2. If the original text DOES end with punctuation (. ! ? etc.), preserve the SAME punctuation in translation
3. If the original starts with lowercase, start translation with lowercase
4. If the original starts with uppercase, start translation with uppercase
5. Preserve leading/trailing spaces exactly as in original
6. Preserve ALL placeholders exactly: %s, %d, %@, {0}, {name}, {{variable}}, <tag>, $variable, etc.

${context ? `Context: ${context}` : ''}
${sourceLanguage ? `Source language: ${sourceLanguage}` : ''}

Return ONLY the translated text, nothing else. No quotes, no explanations.`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text },
    ],
    temperature: 0.2,
    max_tokens: 2000,
  });

  let translation = response.choices[0]?.message?.content?.trim() || '';

  // Post-process to ensure formatting matches
  translation = matchFormatting(text, translation);

  return translation;
}

// Post-process translation to match original formatting
function matchFormatting(original: string, translation: string): string {
  if (!original || !translation) return translation;

  let result = translation;

  // Match leading whitespace
  const originalLeadingSpace = original.match(/^(\s*)/)?.[1] || '';
  const translationLeadingSpace = result.match(/^(\s*)/)?.[1] || '';
  if (originalLeadingSpace !== translationLeadingSpace) {
    result = originalLeadingSpace + result.trimStart();
  }

  // Match trailing whitespace
  const originalTrailingSpace = original.match(/(\s*)$/)?.[1] || '';
  const translationTrailingSpace = result.match(/(\s*)$/)?.[1] || '';
  if (originalTrailingSpace !== translationTrailingSpace) {
    result = result.trimEnd() + originalTrailingSpace;
  }

  // Match ending punctuation
  // Order matters: check longer patterns first (... before .)
  const punctuationMarks = ['...', '。', '！', '？', '.', '!', '?', ':', ';'];
  const originalTrimmed = original.trimEnd();
  let resultTrimmed = result.trimEnd();

  const originalEnding = punctuationMarks.find(p => originalTrimmed.endsWith(p));
  const translationEnding = punctuationMarks.find(p => resultTrimmed.endsWith(p));

  // Remove existing punctuation from translation
  if (translationEnding) {
    resultTrimmed = resultTrimmed.slice(0, -translationEnding.length);
  }

  // Add correct punctuation if original has one
  if (originalEnding) {
    resultTrimmed = resultTrimmed + originalEnding;
  }

  // Restore trailing whitespace
  result = resultTrimmed + (original.endsWith(' ') ? ' ' : '');

  // Match first letter case
  if (result.length > 0 && original.length > 0) {
    const originalFirstChar = original.trimStart().charAt(0);
    const translationFirstChar = result.trimStart().charAt(0);

    const originalIsUpper = originalFirstChar === originalFirstChar.toUpperCase() &&
                            originalFirstChar !== originalFirstChar.toLowerCase();
    const originalIsLower = originalFirstChar === originalFirstChar.toLowerCase() &&
                            originalFirstChar !== originalFirstChar.toUpperCase();

    if (originalIsUpper && translationFirstChar === translationFirstChar.toLowerCase()) {
      const leadingSpace = result.match(/^(\s*)/)?.[1] || '';
      result = leadingSpace + result.trimStart().charAt(0).toUpperCase() + result.trimStart().slice(1);
    } else if (originalIsLower && translationFirstChar === translationFirstChar.toUpperCase()) {
      const leadingSpace = result.match(/^(\s*)/)?.[1] || '';
      result = leadingSpace + result.trimStart().charAt(0).toLowerCase() + result.trimStart().slice(1);
    }
  }

  return result;
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
