
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

export interface AIQuoteResponse {
    quote: string;
    author: string;
}

// Generic AI Call Helper
// Generic AI Call Helper
async function callAI(messages: any[], model: string = "google/gemini-2.0-flash-exp:free"): Promise<any> {
    try {
        console.log("Calling AI Model:", model);
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:5173", // Required by OpenRouter for some free models
                "X-Title": "CGPA Calculator"
            },
            body: JSON.stringify({
                "model": model,
                "messages": messages
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("AI API Error:", response.status, errorText);
            throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const result = await response.json();

        if (!result.choices || !result.choices[0] || !result.choices[0].message) {
            console.error("Unexpected API response structure:", result);
            throw new Error("Invalid response format from AI provider");
        }

        const content = result.choices[0].message.content;
        console.log("AI Response:", content);

        try {
            const jsonString = content.replace(/```json\n?|\n?```/g, '').trim();
            return JSON.parse(jsonString);
        } catch (e) {
            console.warn("Failed to parse JSON from AI response, returning raw text", e);
            return content;
        }
    } catch (error) {
        console.error("callAI failed:", error);
        throw error;
    }
}

export async function fetchAIQuote(): Promise<AIQuoteResponse> {
    try {
        const result = await callAI([
            {
                "role": "user",
                "content": "Give me a short, inspiring quote for a university student. Format it as JSON with 'quote' and 'author' fields. Do not include any markdown formatting."
            }
        ]);
        return result.quote ? result : { quote: result, author: "AI Assistant" };
    } catch (error) {
        console.error("Error fetching AI quote:", error);
        throw error;
    }
}

export async function breakDownTask(taskTitle: string): Promise<string[]> {
    try {
        const result = await callAI([
            {
                "role": "user",
                "content": `Break down the task "${taskTitle}" into 3-5 smaller, actionable sub-tasks. Return ONLY a JSON object with a "steps" key containing an array of strings. Example: { "steps": ["Step 1", "Step 2"] }`
            }
        ]);

        if (result && Array.isArray(result.steps)) {
            return result.steps;
        } else if (Array.isArray(result)) {
            return result; // Fallback if AI ignores wrapper
        }
        return ["Could not generate subtasks. Try again."];
    } catch (error) {
        console.error("Error breaking down task:", error);
        return ["Could not generate subtasks. Try again."];
    }
}

export async function generateStudyPlan(freeSlots: any[], subjects: string[]): Promise<any[]> {
    try {
        const result = await callAI([
            {
                "role": "system",
                "content": "You are a smart academic scheduler. Assign subjects to free time slots based on a balanced schedule."
            },
            {
                "role": "user",
                "content": `I have these free slots: ${JSON.stringify(freeSlots)}. My subjects are: ${JSON.stringify(subjects)}. Create a study plan in JSON format. Return a JSON object with a "plan" key containing an array of sessions. Example: { "plan": [{"day": "Monday", "time": "10:00", "subject": "Math", "focus": "Topic..."}] }`
            }
        ]);

        if (result && Array.isArray(result.plan)) {
            return result.plan;
        } else if (Array.isArray(result)) {
            return result; // Fallback
        }
        return [];
    } catch (error) {
        console.error("Error generating study plan:", error);
        return [];
    }
}
