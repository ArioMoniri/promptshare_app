import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ThumbsUp, ThumbsDown, MessageSquare, Share2, Copy, User } from "lucide-react";
import { Link } from "wouter";
import type { Prompt } from "@db/schema";
import { formatDistanceToNow } from "date-fns";

type PromptWithUser = Prompt & {
  user: {
    id: number;
    username: string;
    avatar: string | null;
  } | null;
};

interface PromptCardProps {
  prompt: PromptWithUser;
}

export default function PromptCard({ prompt }: PromptCardProps) {
  const { toast } = useToast();

  const handleVote = async (value: 1 | -1) => {
    try {
      const response = await fetch(`/api/prompts/${prompt.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast({
        title: "Success",
        description: value === 1 ? "Promoted prompt" : "Downvoted prompt",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt.content);
    toast({
      title: "Copied",
      description: "Prompt copied to clipboard",
    });
  };

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Copied",
      description: "Link copied to clipboard",
    });
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center gap-4">
        <Link href={`/profile/${prompt.user?.id}`}>
          <Avatar className="cursor-pointer">
            <AvatarImage src={prompt.user?.avatar || undefined} alt={prompt.user?.username || ""} />
            <AvatarFallback>
              {prompt.user?.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1">
          <h3 className="font-semibold">{prompt.title}</h3>
          <p className="text-sm text-muted-foreground">
            by {prompt.user?.username} •{" "}
            {formatDistanceToNow(new Date(prompt.createdAt), { addSuffix: true })}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <pre className="p-4 bg-muted rounded-md overflow-x-auto">
          <code>{prompt.content}</code>
        </pre>
        {prompt.description && (
          <p className="mt-4 text-sm text-muted-foreground">
            {prompt.description}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => handleVote(1)}
          >
            <ThumbsUp className="h-4 w-4" />
            {prompt.likes > 0 ? prompt.likes : ''}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => handleVote(-1)}
          >
            <ThumbsDown className="h-4 w-4" />
            {prompt.likes < 0 ? Math.abs(prompt.likes) : ''}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={handleCopy}
          >
            <Copy className="h-4 w-4" />
            Copy
          </Button>
          <Button variant="ghost" size="sm" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            {/* TODO: Add comment count */}
            0
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={handleShare}
        >
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </CardFooter>
    </Card>
  );
}
