import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useUser } from "../hooks/use-user";
import { usePrompts } from "../hooks/use-prompts";
import { useQuery } from "@tanstack/react-query";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { User2, Shield, Key } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

  const userId = id || currentUser?.id;
  
  const { data: userProfile } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      return response.json();
    },
    enabled: !!userId
  });

  const [promptsPage, setPromptsPage] = useState(1);
  const { data: userPromptsData = { prompts: [], total: 0 }, isLoading } = useQuery({
    queryKey: ['userPrompts', userId, promptsPage],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/prompts?page=${promptsPage}&limit=10`);
      if (!response.ok) {
        throw new Error('Failed to fetch user prompts');
      }
      return response.json();
    },
    enabled: !!userId
  });

  const [starredPage, setStarredPage] = useState(1);
  const { data: starredPromptsData = { prompts: [], total: 0 } } = useQuery({
    queryKey: ['starredPrompts', userId, starredPage],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/starred?page=${starredPage}&limit=10`);
      if (!response.ok) {
        throw new Error('Failed to fetch starred prompts');
      }
      return response.json();
    },
    enabled: !!userId
  });

  const [forksPage, setForksPage] = useState(1);
  const { data: userForksData = { forks: [], total: 0 } } = useQuery({
    queryKey: ['userForks', userId, forksPage],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/forks?page=${forksPage}&limit=10`);
      if (!response.ok) {
        throw new Error('Failed to fetch user forks');
      }
      return response.json();
    },
    enabled: !!userId
  });

  const { data: userIssues = [] } = useQuery({
    queryKey: ['userIssues', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/issues`);
      if (!response.ok) {
        throw new Error('Failed to fetch user issues');
      }
      return response.json();
    },
    enabled: !!userId
  });

  useEffect(() => {
    if (userProfile) {
      setProfileUser(userProfile);
    } else if (currentUser) {
      setProfileUser(currentUser);
    }
  }, [userProfile, currentUser]);
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

  const profileSchema = z.object({
    email: z.string().email(),
    name: z.string().min(2),
    surname: z.string().min(2),
  });

  const securitySchema = z.object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(6),
    confirmPassword: z.string()
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      email: displayUser?.email || '',
      name: displayUser?.name || '',
      surname: displayUser?.surname || '',
    },
  });

  const securityForm = useForm({
    resolver: zodResolver(securitySchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const handleProfileUpdate = async (data: z.infer<typeof profileSchema>) => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleSecurityUpdate = async (data: z.infer<typeof securitySchema>) => {
    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast({
        title: "Success",
        description: "Password updated successfully",
      });
      securityForm.reset();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            {isOwnProfile ? "Manage your account settings and API key" : `${displayUser?.username}'s profile`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isOwnProfile ? (
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile" className="gap-2">
                  <User2 className="h-4 w-4" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="security" className="gap-2">
                  <Shield className="h-4 w-4" />
                  Security
                </TabsTrigger>
                <TabsTrigger value="api" className="gap-2">
                  <Key className="h-4 w-4" />
                  API
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4 mt-4">
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-4">
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="surname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Surname</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit">Update Profile</Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="security" className="space-y-4 mt-4">
                <Form {...securityForm}>
                  <form onSubmit={securityForm.handleSubmit(handleSecurityUpdate)} className="space-y-4">
                    <FormField
                      control={securityForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={securityForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={securityForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit">Update Password</Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="api" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    <h3 className="font-medium">OpenAI API Key</h3>
                  </div>

                  {displayUser?.apiKey ? (
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
                          <Key className="h-4 w-4" />
                        ) : (
                          <Key className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No API key set</p>
                  )}

                  <Button 
                    variant="outline"
                    onClick={() => setIsEditingApiKey(true)}
                  >
                    {displayUser?.apiKey ? 'Update API Key' : 'Add API Key'}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
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
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Tabs defaultValue="prompts">
          <TabsList>
            <TabsTrigger value="prompts">My Prompts</TabsTrigger>
            <TabsTrigger value="starred">Starred</TabsTrigger>
            <TabsTrigger value="forks">Forks</TabsTrigger>
            <TabsTrigger value="issues">Issues</TabsTrigger>
            <TabsTrigger value="pull-requests">Pull Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="prompts">
            {promptsLoading ? (
              <div>Loading...</div>
            ) : (
              <div className="space-y-4">
                {userPromptsData?.prompts?.map(prompt => (
                  <PromptCard key={prompt.id} prompt={prompt} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="starred">
            <div className="space-y-4">
              {starredPrompts.map(({ prompt }) => (
                <PromptCard key={prompt.id} prompt={prompt} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="forks">
            <div className="space-y-4">
              {userForks.map(({ fork, original }) => (
                <Card key={fork.id}>
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={original.user?.avatar || undefined} />
                        <AvatarFallback>{original.user?.username?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle>{fork.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Forked from{' '}
                          <Link href={`/profile/${original.user?.id}`} className="hover:underline">
                            {original.user?.username}
                          </Link>
                          's{' '}
                          <Link href={`/prompts/${original.id}`} className="hover:underline">
                            {original.title}
                          </Link>
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{fork.description}</p>
                    {fork.tags?.map((tag) => (
                      <Badge key={tag} variant="secondary" className="mr-2">
                        {tag}
                      </Badge>
                    ))}
                  </CardContent>
                </Card>
              ))}
              {userForks.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  No forks yet
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="issues">
            <div className="space-y-4">
              {userIssues.map(({ issue, prompt }) => (
                <Card key={issue.id}>
                  <CardHeader>
                    <CardTitle>{issue.title}</CardTitle>
                    <div className="text-sm text-muted-foreground">
                      On {prompt.title} by {prompt.user.username}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p>{issue.description}</p>
                    <Badge>{issue.status}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pull-requests">
            <div className="text-center text-muted-foreground py-8">
              Pull requests feature coming soon
            </div>
          </TabsContent>
        </Tabs>
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
