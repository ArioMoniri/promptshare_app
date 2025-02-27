import React from 'react';
import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PromptDialog } from "./PromptDialog";
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
import { Link, useLocation } from "wouter";
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
  Eye,
  Star,
  GitFork,
  AlertTriangle,
} from "lucide-react";
import { cn } from '@/lib/utils';
import type { Prompt } from "@db/schema";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Component Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-200 rounded bg-red-50">
          <h2 className="text-red-800">Something went wrong.</h2>
          <button 
            className="mt-2 text-sm text-red-600 hover:text-red-800"
            onClick={() => this.setState({ hasError: false })}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

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

interface PromptWithComments {
  id: number;
  title: string;
  content: string;
  description: string | null;
  tags: string[];
  upvotes: number | null;
  downvotes: number | null;
  category: string | null;
  version: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  userId: number | null;
  user: {
    id: number;
    username: string;
    avatar: string | null;
  } | null;
  comments?: PromptComment[];
}

interface PromptCardProps {
  prompt: PromptWithComments;
  compact?: boolean;
}

export default function PromptCard({ prompt, compact = false }: PromptCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const [comment, setComment] = useState("");
  const [testInput, setTestInput] = useState("");
  const [testHistory, setTestHistory] = useState<Array<{ input: string; output: string; timestamp: Date }>>([]);
  const [testing, setTesting] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [comments, setComments] = useState<PromptComment[]>(prompt.comments || []);
  const [hasVoted, setHasVoted] = useState<number>(0);
  const [optimisticUpvotes, setOptimisticUpvotes] = useState<number>(prompt.upvotes ?? 0);
  const [optimisticDownvotes, setOptimisticDownvotes] = useState<number>(prompt.downvotes ?? 0);
  const [copied, setCopied] = useState(false);
  const [localStarCount, setLocalStarCount] = useState(0);
  const [isStarred, setIsStarred] = useState(false);
  const [forkCount, setForkCount] = useState(0);
  const [isForked, setIsForked] = useState(false);
  const [showIssues, setShowIssues] = useState(false);
  const [, navigate] = useLocation();

  const { testPrompt } = useOpenAI();
  const { toast } = useToast();

  useEffect(() => {
    if (prompt.id) {
      fetchComments();
      fetchVoteState();
      fetchCounts();
    }
  }, [prompt.id]);

  const fetchVoteState = async () => {
    try {
      const response = await fetch(`/api/prompts/${prompt.id}/vote-state`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch vote state');
      }
      
      const data = await response.json();
      setHasVoted(data.value);
    } catch (error) {
      console.error('Failed to fetch vote state:', error);
      setHasVoted(0); // Set default value on error
    }
  };

  const fetchCounts = async () => {
    try {
      const [starResponse, forkResponse] = await Promise.all([
        fetch(`/api/prompts/${prompt.id}/stars`, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        }),
        fetch(`/api/prompts/${prompt.id}/forks`, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        })
    ]);

    if (!starResponse.ok || !forkResponse.ok) {
      const [starError, forkError] = await Promise.all([
        starResponse.json().catch(() => ({})),
        forkResponse.json().catch(() => ({}))
      ]);
      throw new Error(starError.message || forkError.message || 'Failed to fetch counts');
    }

    const [starData, forkData] = await Promise.all([
      starResponse.json(),
      forkResponse.json()
    ]);

    setLocalStarCount(starData.count || 0);
    setIsStarred(starData.isStarred || false);
    setForkCount(forkData.count || 0);
    setIsForked(forkData.isForked || false);
    } catch (error) {
      console.error('Failed to fetch counts:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch counts"
      });
      // Set default values on error
      setLocalStarCount(0);
      setIsStarred(false);
      setForkCount(0);
      setIsForked(false);
    }
  };

  const fetchComments = async () => {
    if (!prompt.id) return;
    
    try {
      const response = await fetch(`/api/prompts/${prompt.id}/comments`);
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const data = await response.json();
      setComments(data || []);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      setComments([]); // Set empty array instead of showing error
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
      
      // Store previous state for rollback
      const previousState = {
        hasVoted,
        upvotes: optimisticUpvotes,
        downvotes: optimisticDownvotes
      };
      
      // Optimistically update UI
      setHasVoted(newVoteValue);
      setOptimisticUpvotes(prev => prev + (
        value === 1 
          ? (newVoteValue === 1 ? 1 : -1) 
          : (hasVoted === 1 ? -1 : 0)
      ));
      setOptimisticDownvotes(prev => prev + (
        value === -1 
          ? (newVoteValue === -1 ? 1 : -1)
          : (hasVoted === -1 ? -1 : 0)
      ));

      const response = await fetch(`/api/prompts/${prompt.id}/vote`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ value: newVoteValue })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to vote');
      }

      const data = await response.json();
      setOptimisticUpvotes(data.upvotes);
      setOptimisticDownvotes(data.downvotes);
      setHasVoted(newVoteValue);

    } catch (error) {
      console.error('Vote error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to vote",
        variant: "destructive"
      });

      // Revert to previous state
      setHasVoted(previousState.hasVoted);
      setOptimisticUpvotes(previousState.upvotes);
      setOptimisticDownvotes(previousState.downvotes);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied",
      description: "Prompt copied to clipboard",
    });
  };

  const handleStar = async () => {
    try {
      // Optimistic update
      setIsStarred(!isStarred);
      setLocalStarCount(prev => isStarred ? prev - 1 : prev + 1);

      const response = await fetch(`/api/prompts/${prompt.id}/star`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to update star');

      const data = await response.json();
      setIsStarred(data.starred);
      setLocalStarCount(data.count || 0);

      toast({
        title: data.starred ? "Starred" : "Unstarred",
        description: data.starred ? "Added star to prompt" : "Removed star from prompt",
      });
    } catch (error) {
      // Revert optimistic update
      setIsStarred(!isStarred);
      setLocalStarCount(prev => isStarred ? prev + 1 : prev - 1);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update star"
      });
    }
  };

  const handleFork = async () => {
    try {
      const response = await fetch(`/api/prompts/${prompt.id}/fork`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fork prompt');
      }

      const forkedPrompt = await response.json();
      // Handle successful fork
      setForkCount(prev => prev + 1);
      setIsForked(true);
      toast({
        title: "Success",
        description: "Prompt forked successfully"
      });
      navigate(`/prompts/${forkedPrompt.id}`);
    } catch (error) {
      console.error('Fork error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fork prompt",
        variant: "destructive"
      });
    }
  };

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Copied",
      description: "Link copied to clipboard",
    });
  };

  return (
    <ErrorBoundary>
      <Card className={cn("w-full max-w-3xl hover:shadow-lg transition-shadow mx-auto", compact && "p-4")}>
      <CardHeader className={cn(compact && "p-0 pb-4")}>
        <div className="flex items-center space-x-4">
          {prompt.user?.id ? (
            <Link href={`/profile/${prompt.user.id}`} onClick={(e) => e.stopPropagation()}>
              <Avatar>
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
          <div className="flex-grow">
            <CardTitle className={cn("text-lg", compact && "text-base")}>{prompt.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              by{' '}
              {prompt.user ? (
                <Link 
                  href={`/profile/${prompt.user.id}`}
                  className="hover:text-primary hover:underline transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {prompt.user.username}
                </Link>
              ) : (
                'Anonymous'
              )}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleCopy}>
            {copied ? (
              <span className="text-green-500">Copied!</span>
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className={cn(compact && "p-0")}>
        <p className={cn("text-foreground mb-4", compact && "text-sm")}>
          {prompt.content.substring(0, compact ? 50 : 100)}...
        </p>
        {prompt.description && (
          <p className="mt-4 text-sm text-muted-foreground">
            {prompt.description}
          </p>
        )}
        <div className="flex flex-wrap gap-2 mb-2">
          {prompt.category && (
            <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
              {prompt.category}
            </span>
          )}
          {prompt.tags?.map((tag) => (
            <span key={tag} className="bg-secondary/10 text-secondary px-2 py-1 rounded-full text-xs">
              {tag}
            </span>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">Version: {prompt.version}</p>
      </CardContent>
      <CardFooter className="flex items-center gap-2 overflow-x-auto py-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Upvote */}
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => handleVote(1)}>
            <ThumbsUp className={`h-4 w-4 ${hasVoted === 1 ? "fill-current" : ""}`} />
            {optimisticUpvotes > 0 ? optimisticUpvotes : ''}
          </Button>
          
          {/* Downvote */}
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => handleVote(-1)}>
            <ThumbsDown className={`h-4 w-4 ${hasVoted === -1 ? "fill-current" : ""}`} />
            {optimisticDownvotes > 0 ? optimisticDownvotes : ''}
          </Button>
          
          {/* Comment */}
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setShowComments(true)}>
            <MessageSquare className="h-4 w-4" />
            {comments.length}
          </Button>
          
          {/* Issue */}
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => navigate(`/prompts/${prompt.id}/issues`)}>
            <AlertTriangle className="h-4 w-4" />
            Issues
          </Button>
          
          {/* Fork */}
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={handleFork}>
            <GitFork className="h-4 w-4" />
            {forkCount}
          </Button>
          
          {/* Star */}
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={handleStar}>
            <Star className={`h-4 w-4 ${isStarred ? "fill-yellow-400" : ""}`} />
            {localStarCount}
          </Button>
          
          {/* Share */}
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          
          {!compact && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => setShowTest(true)}
            >
              <Bot className="h-4 w-4" />
              Test
            </Button>
          )}
          
          {/* View */}
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setShowPrompt(true)}>
            <Eye className="h-4 w-4" />
            View
          </Button>
          <PromptDialog 
            prompt={prompt}
            open={showPrompt}
            onOpenChange={setShowPrompt}
          />
        </div>
      </CardFooter>

      {/* Issues Dialog */}
      <Dialog open={showIssues} onOpenChange={setShowIssues}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issues</DialogTitle>
            <DialogDescription>Report and track issues for this prompt</DialogDescription>
          </DialogHeader>
          <div className="p-4 text-center text-muted-foreground">
            Issues feature coming soon
          </div>
        </DialogContent>
      </Dialog>

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
    </ErrorBoundary>
  );
}