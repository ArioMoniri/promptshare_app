import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { User, InsertUser } from "@db/schema";
import { useToast } from "@/hooks/use-toast";

type LoginCredentials = {
  username: string;
  password: string;
};

type RequestResult = {
  ok: true;
  user?: User;
} | {
  ok: false;
  message: string;
};

export function useUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user, error, isLoading } = useQuery<User | null, Error>({
    queryKey: ['user'],
    queryFn: async () => {
      const response = await fetch('/api/user', {
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          return null;
        }
        throw new Error(await response.text());
      }

      return response.json();
    },
    staleTime: Infinity,
    retry: false
  });

  const loginMutation = useMutation<RequestResult, Error, LoginCredentials>({
    mutationFn: async (credentials) => {
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
          credentials: 'include'
        });
        
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to login');
        }
        
        return { ok: true, user: data.user };
      } catch (error: any) {
        throw new Error(error.message || 'Failed to login');
      }
    },
    onSuccess: (data) => {
      if (data.user) {
        queryClient.setQueryData(['user'], data.user);
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  });

  const logoutMutation = useMutation<RequestResult, Error>({
    mutationFn: async () => {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return { ok: true };
    },
    onSuccess: () => {
      queryClient.setQueryData(['user'], null);
    },
  });

  const registerMutation = useMutation<RequestResult, Error, InsertUser>({
    mutationFn: async (userData) => {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return { ok: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  return {
    user,
    isLoading,
    error,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    register: registerMutation.mutateAsync,
  };
}
