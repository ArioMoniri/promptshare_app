import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Prompt, InsertPrompt } from "@db/schema";

type PromptWithUser = Prompt & {
  user: {
    id: number;
    username: string;
    avatar: string | null;
  } | null;
  comments?: Array<{
    id: number;
    content: string;
    createdAt: string;
    user: {
      id: number;
      username: string;
      avatar: string | null;
    } | null;
  }>;
  tags: string[];
};

interface UsePromptsOptions {
  sort?: 'recent' | 'popular' | 'controversial';
  search?: string;
  category?: string;
}

async function fetchPrompts(options: UsePromptsOptions = {}): Promise<PromptWithUser[]> {
  const { sort = 'recent', search = '' } = options;
  const params = new URLSearchParams();
  if (sort) params.set('sort', sort);
  if (search) params.set('search', search);
  
  const response = await fetch(`/api/prompts?${params}`);
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
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error("Failed to create prompt");
  }
  
  return response.json();
}

export function usePrompts(options: UsePromptsOptions = {}) {
  const queryClient = useQueryClient();

  const { data: prompts, isLoading, error } = useQuery<PromptWithUser[]>({
    queryKey: ['prompts', options],
    queryFn: () => fetchPrompts(options),
  });

  const createMutation = useMutation({
    mutationFn: createPrompt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
    },
  });

  return {
    prompts,
    isLoading,
    error,
    createPrompt: createMutation.mutateAsync,
  };
}
