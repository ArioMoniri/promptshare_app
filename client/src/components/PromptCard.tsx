import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ThumbsUp, ThumbsDown, MessageSquare, Share2, Copy, User, Send, Bot } from "lucide-react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Prompt } from "@db/schema";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useOpenAI } from "../hooks/use-openai";

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
  const [showComments, setShowComments] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const [comment, setComment] = useState("");
  const [testInput, setTestInput] = useState("");
  const { testPrompt } = useOpenAI();

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
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2"
            onClick={() => setShowComments(true)}
          >
            <MessageSquare className="h-4 w-4" />
            {prompt.comments?.length || 0}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => setShowTest(true)}
          >
            <Bot className="h-4 w-4" />
            Test
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

      {/* Comments Dialog */}
      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {prompt.comments?.map((comment) => (
                <div key={comment.id} className="flex gap-3 items-start">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.user?.avatar} />
                    <AvatarFallback>{comment.user?.username[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{comment.user?.username}</p>
                    <p className="text-sm text-muted-foreground">{comment.content}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="flex gap-2 pt-4">
            <Input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write a comment..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && comment) {
                  handleComment();
                }
              }}
            />
            <Button onClick={handleComment} disabled={!comment}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={showTest} onOpenChange={setShowTest}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Prompt</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4 p-4">
              <div className="bg-muted p-4 rounded-lg">
                <pre className="whitespace-pre-wrap">{prompt.content}</pre>
              </div>
              <div className="space-y-4">
                {/* Test results will be shown here */}
              </div>
            </div>
          </ScrollArea>
          <div className="flex gap-2 pt-4">
            <Input
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Enter test input..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && testInput) {
                  handleTest();
                }
              }}
            />
            <Button onClick={handleTest} disabled={!testInput}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
