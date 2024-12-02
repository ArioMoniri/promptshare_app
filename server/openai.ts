import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export async function testPrompt(prompt: string, input: string) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is required');
  }

  // Replace {input} placeholder in prompt with actual input
  const formattedPrompt = prompt.replace(/{input}/g, input);
  
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant. Follow the given prompt instructions carefully."
        },
        {
          role: "user",
          content: formattedPrompt
        }
      ],
      model: "gpt-4o",
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    return {
      output: completion.choices[0].message.content,
      usage: completion.usage
    };
  } catch (error: any) {
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
      model: "gpt-4-turbo-preview",
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

    const content = response.choices[0].message.content;
    return content ? JSON.parse(content) : {
      effectiveness: 0,
      suggestions: ["Failed to analyze prompt"],
      tone: "unknown"
    };
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
