import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useUser } from "../hooks/use-user";
import { usePrompts } from "../hooks/use-prompts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Key, Edit2, Eye, EyeOff } from "lucide-react";
import PromptCard from "./PromptCard";
import type { User } from "@db/schema";

export default function UserProfile() {
  const { id } = useParams();
  const { user: currentUser } = useUser();
  const { prompts } = usePrompts();
  const { toast } = useToast();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isEditingApiKey, setIsEditingApiKey] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`/api/users/${id}`);
        if (!response.ok) {
          const errorMessage = await response.text();
          throw new Error(errorMessage || `Failed to fetch user profile (${response.status})`);
        }
        const data = await response.json();
        if (!data || !data.id) {
          throw new Error('Invalid user data received');
        }
        setProfileUser(data);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to fetch user profile",
        });
        // Reset profile user to ensure clean state
        setProfileUser(null);
      }
    };

    if (id) {
      fetchUserProfile();
    } else if (currentUser) {
      setProfileUser(currentUser);
    }
  }, [id, currentUser]);

  const userPrompts = prompts?.filter(p => p.userId === (profileUser?.id ?? currentUser?.id)) || [];
  const isOwnProfile = profileUser?.id === currentUser?.id;

  const handleSaveApiKey = async () => {
    if (!isOwnProfile) return;

    try {
      const response = await fetch('/api/user/apikey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast({
        title: "Success",
        description: "API key updated successfully",
      });
      setIsEditingApiKey(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const maskApiKey = (key: string) => {
    return `sk-...${key.slice(-4)}`;
  };

  if (!profileUser && !currentUser) {
    return <div>Loading...</div>;
  }

  const displayUser = profileUser || currentUser;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            {isOwnProfile ? "Manage your account settings and API key" : `${displayUser.username}'s profile`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={displayUser?.avatar || undefined} alt={displayUser?.username || ""} />
              <AvatarFallback>
                {displayUser?.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{displayUser?.name} {displayUser?.surname}</h2>
              <p className="text-muted-foreground">@{displayUser?.username}</p>
              <p className="text-sm text-muted-foreground">{displayUser?.email}</p>
            </div>
          </div>

          {isOwnProfile && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  <h3 className="font-medium">OpenAI API Key</h3>
                </div>
                <Button variant="outline" size="sm" onClick={() => setIsEditingApiKey(true)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
              {displayUser?.apiKey && (
                <div className="flex items-center gap-2">
                  <code className="bg-muted px-2 py-1 rounded">
                    {showApiKey ? displayUser.apiKey : maskApiKey(displayUser.apiKey)}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">
          {isOwnProfile ? "Your Prompts" : `${displayUser.username}'s Prompts`}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userPrompts.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} />
          ))}
        </div>
      </div>

      <Dialog open={isEditingApiKey} onOpenChange={setIsEditingApiKey}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update OpenAI API Key</DialogTitle>
            <DialogDescription>
              Enter your OpenAI API key to test and create prompts
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditingApiKey(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveApiKey}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
