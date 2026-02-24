import OpenAI from 'openai';
import type { TestSuggestion, TestCategory } from '../types';

/**
 * Calls OpenAI chat completions API and parses the response into test suggestions.
 */
export async function generateTests(
    apiKey: string,
    prompt: string,
    category: TestCategory
): Promise<TestSuggestion[]> {
    const client = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true,
    });

    const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            {
                role: 'system',
                content: 'You are an expert React testing engineer. You respond ONLY with valid JSON arrays. No markdown, no explanation, only JSON.',
            },
            {
                role: 'user',
                content: prompt,
            },
        ],
        temperature: 0.7,
        max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content ?? '[]';

    try {
        // Extract JSON from response (handle potential markdown wrapping)
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (!jsonMatch) return [];

        const parsed = JSON.parse(jsonMatch[0]) as Array<{
            title: string;
            description: string;
            code: string;
            priority: 'high' | 'medium' | 'low';
        }>;

        return parsed.map((item, index) => ({
            id: `${category}-${index}`,
            category,
            title: item.title,
            description: item.description,
            code: item.code,
            priority: item.priority,
        }));
    } catch {
        console.error('Failed to parse AI response:', content);
        return [];
    }
}
