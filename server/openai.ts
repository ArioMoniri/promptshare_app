import OpenAI from "openai";

class OpenAIService {
  async test(prompt: string, apiKey: string) {
    const openai = new OpenAI({ apiKey });

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
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
      temperature: 0.7
    });

    return {
      output: response.choices[0].message.content,
      usage: response.usage
    };
  }
}

export const openai = new OpenAIService();
