import { useState } from "react";
import { useUser } from "./use-user";

export function useOpenAI() {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const testPrompt = async (input: string) => {
    if (!user?.apiKey) {
      throw new Error('Please add your OpenAI API key in your profile settings');
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/test-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    } finally {
      setIsLoading(false);
    }
  };

  return {
    testPrompt,
    isLoading,
  };
}
