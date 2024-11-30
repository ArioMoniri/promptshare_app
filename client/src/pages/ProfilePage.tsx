import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PromptCard from "../components/PromptCard";
import { Loader2 } from "lucide-react";
import type { User, Prompt } from "@db/schema";

async function fetchUserProfile(userId: string) {
  const response = await fetch(`/api/users/${userId}`, {
    credentials: 'include'
  });
  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }
  return response.json() as Promise<User>;
}

async function fetchUserPrompts(userId: string) {
  const response = await fetch(`/api/prompts?userId=${userId}`, {
    credentials: 'include'
  });
  if (!response.ok) {
    throw new Error('Failed to fetch user prompts');
  }
  return response.json() as Promise<Prompt[]>;
}

export default function ProfilePage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<'prompts' | 'liked'>('prompts');

  const { data: user, isLoading: loadingUser, error: userError } = useQuery({
    queryKey: ['user', id],
    queryFn: () => fetchUserProfile(id),
  });

  const { data: prompts, isLoading: loadingPrompts, error: promptsError } = useQuery({
    queryKey: ['userPrompts', id],
    queryFn: () => fetchUserPrompts(id),
  });

  if (loadingUser || loadingPrompts) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (userError || promptsError) {
    return (
      <div className="text-center text-destructive">
        {userError?.message || promptsError?.message || 'Something went wrong'}
      </div>
    );
  }

  if (!user) {
    return <div className="text-center">User not found</div>;
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card>
        <CardContent className="flex items-center gap-6 p-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={user.avatar || undefined} />
            <AvatarFallback>{user.username?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{user.username}</h1>
            {user.name && user.surname && (
              <p className="text-muted-foreground">
                {user.name} {user.surname}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Member since {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="prompts">Prompts</TabsTrigger>
          <TabsTrigger value="liked">Liked Prompts</TabsTrigger>
        </TabsList>
        <TabsContent value="prompts" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {prompts?.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="liked" className="mt-6">
          <div className="text-center text-muted-foreground">
            Liked prompts coming soon
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
