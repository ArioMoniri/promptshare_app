import { useState } from "react";
import { useUser } from "./use-user";
import { useToast } from "./use-toast";

interface TestResponse {
  output: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export function useOpenAI() {
  const { user } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const testPrompt = async (prompt: string, input: string = "") => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, input }),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to test prompt');
      }

      const data: TestResponse = await response.json();
      return {
        output: data.output,
        usage: data.usage
      };
    } catch (error) {
      console.error('Test prompt error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to test prompt: ${errorMessage}`
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const analyzePrompt = async (prompt: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/analyze-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze prompt');
      }

      return response.json();
    } catch (error) {
      console.error('Analyze prompt error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to analyze prompt: ${errorMessage}`
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    testPrompt,
    analyzePrompt,
    isLoading,
  };
}
