import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
export async function testPrompt(messages: Array<{ role: string; content: string }>, apiKey: string) {
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }

  const openai = new OpenAI({ apiKey });
  
  try {
    const completion = await openai.chat.completions.create({
      messages,
      model: "gpt-4o",
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    return completion;
  } catch (error: any) {
    // Enhance error handling with more specific error messages
    if (error.response) {
      throw new Error(`OpenAI API error: ${error.response.data.error.message}`);
    } else if (error.message) {
      throw new Error(`Error: ${error.message}`);
    } else {
      throw new Error('An unknown error occurred while testing the prompt');
    }
  }
}

// Function to analyze prompt effectiveness
export async function analyzePrompt(prompt: string, apiKey: string): Promise<{
  effectiveness: number;
  suggestions: string[];
  tone: string;
}> {
  const openai = new OpenAI({ apiKey });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a prompt engineering expert. Analyze the given prompt and provide feedback on its effectiveness, suggestions for improvement, and tone analysis. Respond with JSON in this format: { 'effectiveness': number from 0 to 1, 'suggestions': array of strings, 'tone': string }"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error: any) {
    if (error.response) {
      throw new Error(`OpenAI API error: ${error.response.data.error.message}`);
    } else if (error.message) {
      throw new Error(`Error: ${error.message}`);
    } else {
      throw new Error('An unknown error occurred while analyzing the prompt');
    }
  }
}
