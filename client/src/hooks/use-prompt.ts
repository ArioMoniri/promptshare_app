import { useQuery } from "@tanstack/react-query";
import type { Prompt } from "@db/schema";

async function fetchPrompt(id: string): Promise<Prompt> {
  const response = await fetch(`/api/prompts/${id}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export function usePrompt(id: string | undefined) {
  const { data: prompt, isLoading, error } = useQuery({
    queryKey: ["prompt", id],
    queryFn: () => fetchPrompt(id!),
    enabled: !!id,
  });

  return {
    prompt,
    isLoading,
    error,
  };
}
