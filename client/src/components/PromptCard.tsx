import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Heart, MessageSquare, Share2 } from "lucide-react";
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

  const handleLike = async () => {
    // TODO: Implement like functionality
    toast({
      title: "Liked",
      description: "You liked this prompt",
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
        <Avatar>
          <AvatarImage src={prompt.user?.avatar} />
          <AvatarFallback>
            {prompt.user?.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
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
            onClick={handleLike}
          >
            <Heart className="h-4 w-4" />
            {prompt.likes}
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
