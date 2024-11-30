import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useOpenAI } from "../hooks/use-openai";
import { formatDistanceToNow } from "date-fns";
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Copy,
  Share2,
  Bot,
  Send,
  Loader2,
} from "lucide-react";
import type { Prompt } from "@db/schema";

interface PromptComment {
  id: number;
  content: string;
  createdAt: string;
  user: {
    id: number;
    username: string;
    avatar: string | null;
  } | null;
}

interface PromptWithComments extends Prompt {
  comments?: PromptComment[];
}

interface PromptCardProps {
  prompt: PromptWithComments;
}

export default function PromptCard({ prompt }: PromptCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const [comment, setComment] = useState("");
  const [testInput, setTestInput] = useState("");
  const [testHistory, setTestHistory] = useState<Array<{ input: string; output: string; timestamp: Date }>>([]);
  const [testing, setTesting] = useState(false);
  const [comments, setComments] = useState<PromptComment[]>(prompt.comments || []);
  const [hasVoted, setHasVoted] = useState<number>(0);
  const [optimisticUpvotes, setOptimisticUpvotes] = useState<number>(prompt.upvotes ?? 0);
  const [optimisticDownvotes, setOptimisticDownvotes] = useState<number>(prompt.downvotes ?? 0);

  const { testPrompt } = useOpenAI();
  const { toast } = useToast();

  useEffect(() => {
    if (prompt.id) {
      fetchComments();
      // Add WebSocket or polling mechanism to keep votes in sync
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/prompts/${prompt.id}`);
          if (!response.ok) throw new Error('Failed to fetch prompt');
          const data = await response.json();
          setOptimisticUpvotes(data.upvotes);
          setOptimisticDownvotes(data.downvotes);
        } catch (error) {
          console.error('Failed to sync votes:', error);
        }
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(interval);
    }
  }, [prompt.id]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/prompts/${prompt.id}/comments`);
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const data = await response.json();
      setComments(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch comments",
      });
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    
    try {
      const response = await fetch(`/api/prompts/${prompt.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: comment }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const newComment = await response.json();
      setComments(prev => [...prev, newComment]);
      setComment('');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleTest = async () => {
    if (!testInput) return;
    setTesting(true);
    try {
      const result = await testPrompt(testInput);
      setTestHistory(prev => [...prev, {
        input: testInput,
        output: result.output,
        timestamp: new Date()
      }]);
      setTestInput("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleVote = async (value: 1 | -1) => {
    try {
      const newVoteValue = hasVoted === value ? 0 : value;
      const previousVote = hasVoted;
      const previousUpvotes = optimisticUpvotes;
      const previousDownvotes = optimisticDownvotes;

      // Optimistically update UI
      setHasVoted(newVoteValue);
      if (value === 1) {
        if (previousVote === -1) setOptimisticDownvotes(prev => prev - 1);
        setOptimisticUpvotes(prev => newVoteValue === 1 ? prev + 1 : prev - 1);
      } else {
        if (previousVote === 1) setOptimisticUpvotes(prev => prev - 1);
        setOptimisticDownvotes(prev => newVoteValue === -1 ? prev + 1 : prev - 1);
      }

      const response = await fetch(`/api/prompts/${prompt.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
        credentials: 'include',
      });

      if (!response.ok) {
        // Revert optimistic updates on error
        setHasVoted(previousVote);
        setOptimisticUpvotes(previousUpvotes);
        setOptimisticDownvotes(previousDownvotes);
        throw new Error(await response.text());
      }
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
        {prompt.user?.id ? (
          <Link href={`/profile/${prompt.user.id}`} onClick={(e) => e.stopPropagation()}>
            <Avatar className="cursor-pointer">
              <AvatarImage src={prompt.user.avatar || undefined} alt={prompt.user.username || ""} />
              <AvatarFallback>
                {prompt.user.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <Avatar>
            <AvatarFallback>?</AvatarFallback>
          </Avatar>
        )}
        <div className="flex-1">
          <h3 className="font-semibold">{prompt.title}</h3>
          <p className="text-sm text-muted-foreground">
            by {prompt.user?.id ? (
              <Link href={`/profile/${prompt.user.id}`} className="hover:underline cursor-pointer">
                {prompt.user.username}
              </Link>
            ) : "Unknown User"} •{" "}
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
      <CardFooter>
        <div className="flex justify-between items-center w-full">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => handleVote(1)}
            >
              <ThumbsUp className={`h-4 w-4 ${hasVoted === 1 ? "fill-current" : ""}`} />
              {optimisticUpvotes > 0 ? optimisticUpvotes : ''}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => handleVote(-1)}
            >
              <ThumbsDown className={`h-4 w-4 ${hasVoted === -1 ? "fill-current" : ""}`} />
              {optimisticDownvotes > 0 ? optimisticDownvotes : ''}
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
              {comments.length}
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
        </div>
      </CardFooter>

      {/* Comments Dialog */}
      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
            <DialogDescription>View and add comments for this prompt</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 items-start">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.user?.avatar || undefined} />
                    <AvatarFallback>{comment.user?.username?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    {comment.user?.id ? (
                      <Link href={`/profile/${comment.user.id}`}>
                        <p className="text-sm font-medium hover:underline cursor-pointer">
                          {comment.user.username}
                        </p>
                      </Link>
                    ) : (
                      <p className="text-sm font-medium text-muted">Deleted User</p>
                    )}
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
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Test Prompt</DialogTitle>
            <DialogDescription>Test this prompt with custom inputs</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-medium mb-2">Prompt Template:</h3>
                <pre className="whitespace-pre-wrap text-sm">{prompt.content}</pre>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setTestInput(prompt.content)}
                className="w-full"
              >
                Paste Prompt as Input
              </Button>
              <div className="flex gap-2">
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
                <Button 
                  onClick={handleTest} 
                  disabled={testing || !testInput}
                  className="shrink-0"
                >
                  {testing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <ScrollArea className="h-[500px] border rounded-lg">
              <div className="space-y-4 p-4">
                {testHistory.map((result, index) => (
                  <div key={index} className="space-y-2">
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="font-medium text-sm">Input:</p>
                      <p className="text-sm">{result.input}</p>
                    </div>
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <p className="font-medium text-sm">Output:</p>
                      <pre className="text-sm whitespace-pre-wrap">{result.output}</pre>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(result.timestamp, { addSuffix: true })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
