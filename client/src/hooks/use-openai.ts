import { useState } from "react";

export function useOpenAI() {
  const [isLoading, setIsLoading] = useState(false);

  const testPrompt = async (prompt: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/test-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
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
