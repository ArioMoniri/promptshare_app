import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Prompt, InsertPrompt } from "@db/schema";

type PromptWithUser = Prompt & {
  user: {
    id: number;
    username: string;
    avatar: string | null;
  } | null;
};

async function fetchPrompts(): Promise<PromptWithUser[]> {
  const response = await fetch("/api/prompts");
  if (!response.ok) {
    throw new Error("Failed to fetch prompts");
  }
  return response.json();
}

async function createPrompt(prompt: InsertPrompt): Promise<Prompt> {
  const response = await fetch("/api/prompts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(prompt),
  });
  
  if (!response.ok) {
    throw new Error("Failed to create prompt");
  }
  
  return response.json();
}

export function usePrompts() {
  const queryClient = useQueryClient();

  const { data: prompts, isLoading, error } = useQuery<PromptWithUser[]>({
    queryKey: ["prompts"],
    queryFn: fetchPrompts,
  });

  const createMutation = useMutation({
    mutationFn: createPrompt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
    },
  });

  return {
    prompts,
    isLoading,
    error,
    createPrompt: createMutation.mutateAsync,
  };
}
