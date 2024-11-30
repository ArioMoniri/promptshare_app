import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
export async function testPrompt(input: string, apiKey: string) {
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }

  const openai = new OpenAI({ apiKey });
  
  try {
    const response = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant. Format your response as a JSON object."
        },
        {
          role: "user",
          content: input
        }
      ],
      model: "gpt-4o",
      response_format: { type: "json_object" }
    });

    return {
      output: response.choices[0]?.message?.content || 'No response',
    };
  } catch (error: any) {
    throw new Error(`OpenAI API error: ${error.message}`);
  }
}

export async function analyzePrompt(prompt: string, apiKey: string) {
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }

  const openai = new OpenAI({ apiKey });

  try {
    const response = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Analyze the given prompt and provide feedback on its effectiveness, clarity, and potential improvements. Format your response as a JSON object with the following structure: { 'effectiveness': number, 'clarity': number, 'suggestions': string[], 'tags': string[] }"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-4o",
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0]?.message?.content || '{}');
  } catch (error: any) {
    throw new Error(`OpenAI API error: ${error.message}`);
  }
}
