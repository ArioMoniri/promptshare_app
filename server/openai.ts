import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
export async function testPrompt(input: string, prompt: string, apiKey: string) {
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }

  const openai = new OpenAI({ apiKey });
  
  try {
    const response = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: prompt
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
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0
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
          content: "You are a prompt engineering expert. Analyze the given prompt and provide detailed feedback. Format your response as a JSON object with the following structure: { 'effectiveness': number, 'clarity': number, 'suggestions': string[], 'tags': string[], 'strengths': string[], 'weaknesses': string[], 'estimatedTokens': number }"
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

export async function generateTags(prompt: string, apiKey: string): Promise<string[]> {
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }

  const openai = new OpenAI({ apiKey });

  try {
    const response = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Generate relevant tags for the given AI prompt. Return a JSON array of strings, with each tag being a single word or short phrase. Format: { 'tags': string[] }"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-4o",
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{"tags": []}');
    return result.tags || [];
  } catch (error: any) {
    throw new Error(`OpenAI API error: ${error.message}`);
  }
}
