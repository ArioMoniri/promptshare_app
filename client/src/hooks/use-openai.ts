import { useState } from "react";
import { useUser } from "./use-user";

interface Message {
  role: string;
  content: string;
}

interface TestResponse {
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export function useOpenAI() {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const testPrompt = async (input: string) => {
    if (!user?.apiKey) {
      throw new Error('Please add your OpenAI API key in your profile settings');
    }

    setIsLoading(true);
    try {
      const messages: Message[] = [
        {
          role: "system",
          content: "You are a helpful assistant."
        },
        {
          role: "user",
          content: input
        }
      ];

      const response = await fetch('/api/test-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to test prompt');
      }

      const data: TestResponse = await response.json();
      return {
        output: data.content,
        tokenUsage: data.usage
      };
    } catch (error) {
      console.error('Test prompt error:', error);
      throw new Error('Failed to test prompt: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    testPrompt,
    isLoading,
  };
}
