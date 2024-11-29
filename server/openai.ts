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
          content: "You are a helpful, creative, and adaptable AI assistant. Analyze each prompt thoughtfully and provide detailed, contextually appropriate responses. Feel free to be imaginative while maintaining relevance and accuracy. Your responses should be natural and engaging, helping users achieve their goals effectively."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 2000
    });

    return {
      output: response.choices[0].message.content,
      usage: response.usage
    };
  }
}

export const openai = new OpenAIService();
