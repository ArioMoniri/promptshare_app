import OpenAI from "openai";

class OpenAIService {
  async test(prompt: string, apiKey: string) {
    const openai = new OpenAI({ apiKey });

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert AI assistant focused on helping users test and improve their prompts. Your goal is to provide clear, helpful responses that demonstrate how the prompt performs. Remember to maintain the original intent of the prompt while providing meaningful output."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    return {
      output: response.choices[0].message.content,
      usage: response.usage
    };
  }
}

export const openai = new OpenAIService();
