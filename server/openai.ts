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
          content: "As a versatile AI assistant, engage naturally with users and respond thoughtfully to their prompts. Aim to provide creative, detailed, and contextually relevant responses while maintaining a conversational tone."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 1.0,
      max_tokens: 1000
    });

    return {
      output: response.choices[0].message.content,
      usage: response.usage
    };
  }
}

export const openai = new OpenAIService();
