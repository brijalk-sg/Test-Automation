import type { TestSuggestion, TestCategory } from '../types';

/**
 * Calls Gemini API via fetch and parses the response into test suggestions.
 */
export async function generateTests(
    apiKey: string,
    prompt: string,
    category: TestCategory
): Promise<TestSuggestion[]> {
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        {
                            text: `You are an expert React testing engineer. You respond ONLY with a JSON array of test objects. 
                            Each object must have: title, description, code, and priority ('high', 'medium', or 'low').
                            No markdown, no explanation, just the JSON array.
                            
                            Prompt: ${prompt}`
                        }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.2,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 4096,
                responseMimeType: 'application/json',
            }
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        let message = `Gemini API error (${response.status})`;
        try {
            const parsed = JSON.parse(errorBody);
            message = parsed.error?.message || message;
        } catch {
            // use default message
        }
        throw new Error(message);
    }

    const data = await response.json();

    // Gemini sometimes returns content in markdown blocks or just raw text
    let content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]';

    try {
        // 1. Try stripping markdown backticks if present
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        const jsonString = jsonMatch ? jsonMatch[0] : content;

        const parsed = JSON.parse(jsonString) as Array<{
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
    } catch (e) {
        console.error(`Failed to parse Gemini response for ${category}:`, content, e);
        // If it's not valid JSON, we might be getting a text refusal or a malformed response
        return [];
    }
}
