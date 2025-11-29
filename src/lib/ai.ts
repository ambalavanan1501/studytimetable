
const OPENROUTER_API_KEY = "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"; // TODO: Move to import.meta.env.VITE_OPENROUTER_API_KEY

export interface AIQuoteResponse {
    quote: string;
    author: string;
}

export async function fetchAIQuote(): Promise<AIQuoteResponse> {
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "x-ai/grok-4.1-fast:free",
                "messages": [
                    {
                        "role": "user",
                        "content": "Give me a short, inspiring quote for a university student. Format it as JSON with 'quote' and 'author' fields. Do not include any markdown formatting."
                    }
                ],
                "reasoning": { "enabled": true }
            })
        });

        if (!response.ok) {
            throw new Error(`API call failed: ${response.statusText}`);
        }

        const result = await response.json();
        const content = result.choices[0].message.content;

        // Try to parse JSON from the content
        try {
            // Sometimes models wrap JSON in markdown code blocks
            const jsonString = content.replace(/```json\n?|\n?```/g, '').trim();
            return JSON.parse(jsonString);
        } catch (e) {
            // Fallback if not valid JSON
            console.warn("Failed to parse JSON from AI response, returning raw text", e);
            return {
                quote: content,
                author: "AI Assistant"
            };
        }

    } catch (error) {
        console.error("Error fetching AI quote:", error);
        throw error;
    }
}
