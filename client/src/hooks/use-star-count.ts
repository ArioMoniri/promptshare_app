import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface StarState {
  count: number;
  isStarred: boolean;
}

export function useStarCount(promptId: number) {
  const queryClient = useQueryClient();

  const { data: starState, isLoading } = useQuery<StarState>({
    queryKey: ['stars', promptId],
    queryFn: async () => {
      const response = await fetch(`/api/prompts/${promptId}/stars`);
      if (!response.ok) {
        throw new Error('Failed to fetch star count');
      }
      return response.json();
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  const starMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/prompts/${promptId}/star`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to update star');
      }
      return response.json();
    },
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['stars', promptId] });

      // Get current state
      const previousState = queryClient.getQueryData(['stars', promptId]);

      // Optimistically update
      queryClient.setQueryData(['stars', promptId], (old: StarState) => ({
        count: old.count + (old.isStarred ? -1 : 1),
        isStarred: !old.isStarred,
      }));

      return { previousState };
    },
    onError: (err, newTodo, context) => {
      // Revert the optimistic update
      queryClient.setQueryData(['stars', promptId], context?.previousState);
    },
    onSettled: () => {
      // Refetch to ensure we have the correct data
      queryClient.invalidateQueries({ queryKey: ['stars', promptId] });
    },
  });

  return {
    starCount: starState?.count ?? 0,
    isStarred: starState?.isStarred ?? false,
    isLoading,
    toggleStar: () => starMutation.mutate(),
  };
}
