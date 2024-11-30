import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
export async function testPrompt(input: string, apiKey: string) {
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }

  const openai = new OpenAI({ apiKey });
  
  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: input }],
      model: "gpt-4o",
      response_format: { type: "json_object" }
    });

    return {
      output: completion.choices[0]?.message?.content || 'No response',
    };
  } catch (error: any) {
    throw new Error(error.message);
  }
}
