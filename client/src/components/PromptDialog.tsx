import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Copy, ThumbsUp, ThumbsDown, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Prompt {
  id: number;
  title: string;
  content: string;
  description?: string;
  originalPromptId?: number;
  userId?: number;
  user?: {
    username: string;
  };
}

interface PromptDialogProps {
  prompt: Prompt;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PromptDialog({ prompt, open, onOpenChange }: PromptDialogProps) {
  const { toast } = useToast();
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [downvoteCount, setDownvoteCount] = useState(0);
  const [starCount, setStarCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const isForked = prompt.originalPromptId != null;
  const canEdit = isForked && prompt.userId === prompt.user?.id;

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(prompt.content);
    toast({
      title: "Copied",
      description: "Prompt copied to clipboard"
    });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`sRef: ${prompt.id}`);
    toast({
      title: "Copied",
      description: "Reference ID copied to clipboard"
    });
  };

  const handlePromote = async () => {
    try {
      const response = await fetch(`/api/prompts/${prompt.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: 1 }),
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to upvote');
      
      setUpvoteCount(prev => prev + 1);
      toast({
        title: "Success",
        description: "Successfully promoted the prompt"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  const handleDownvote = async () => {
    try {
      const response = await fetch(`/api/prompts/${prompt.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: -1 }),
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to downvote');
      
      setDownvoteCount(prev => prev + 1);
      toast({
        title: "Success",
        description: "Successfully downvoted the prompt"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  const handleStar = async () => {
    try {
      const response = await fetch(`/api/prompts/${prompt.id}/star`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to star');
      
      setStarCount(prev => prev + 1);
      toast({
        title: "Success",
        description: "Successfully starred the prompt"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogTitle className="sr-only">View Prompt</DialogTitle>
        <div className="flex items-center gap-4 mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onOpenChange(false)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h2 className="text-2xl font-bold flex-grow">{prompt.title}</h2>
          <div className="flex gap-2">
            {canEdit && (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={copyToClipboard}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
          <span>by {prompt.user?.username}</span>
          <span>•</span>
          <span>sRef: {prompt.id}</span>
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        <Tabs defaultValue="prompt">
          <TabsList>
            <TabsTrigger value="prompt">Prompt</TabsTrigger>
            <TabsTrigger value="discussion">Discussion</TabsTrigger>
            <TabsTrigger value="issues">Issues</TabsTrigger>
            <TabsTrigger value="forks">Forks</TabsTrigger>
            <TabsTrigger value="versions">Versions</TabsTrigger>
          </TabsList>

          <TabsContent value="prompt">
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <pre className="whitespace-pre-wrap">{prompt.content}</pre>
              </div>
              {prompt.description && (
                <p className="text-muted-foreground">{prompt.description}</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="discussion">
            <div className="p-4 text-muted-foreground">Discussion feature coming soon</div>
          </TabsContent>

          <TabsContent value="issues">
            <div className="p-4 text-muted-foreground">Issues feature coming soon</div>
          </TabsContent>

          <TabsContent value="forks">
            <div className="p-4 text-muted-foreground">Forks feature coming soon</div>
          </TabsContent>

          <TabsContent value="versions">
            <div className="p-4 text-muted-foreground">Version history coming soon</div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 mt-4">
          <Button onClick={handlePromote} className="flex-1">
            <ThumbsUp className="h-4 w-4 mr-2" />
            Promote ({upvoteCount})
          </Button>
          <Button onClick={handleDownvote} className="flex-1">
            <ThumbsDown className="h-4 w-4 mr-2" />
            Downvote ({downvoteCount})
          </Button>
          <Button onClick={handleStar} className="flex-1">
            <Star className="h-4 w-4 mr-2" />
            Star ({starCount})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
