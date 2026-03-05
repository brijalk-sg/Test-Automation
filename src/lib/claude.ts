import type { TestSuggestion, TestCategory } from '../types';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

/**
 * Calls Claude API via fetch and parses the response into test suggestions.
 * Uses direct fetch since the Anthropic SDK doesn't support browser environments.
 */
export async function generateTests(
    apiKey: string,
    prompt: string,
    category: TestCategory
): Promise<TestSuggestion[]> {
    const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            system: 'You are an expert React testing engineer. You respond ONLY with valid JSON arrays. No markdown, no explanation, only JSON.',
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        let message = `Claude API error (${response.status})`;
        try {
            const parsed = JSON.parse(errorBody);
            message = parsed.error?.message || message;
        } catch {
            // use default message
        }
        throw new Error(message);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text ?? '[]';

    try {
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
