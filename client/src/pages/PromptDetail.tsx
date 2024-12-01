import { useParams } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Star, GitFork, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { usePrompt } from "@/hooks/use-prompt";

interface ComponentProps {
  promptId: number;
}

function StarButton({ promptId }: ComponentProps) {
  const [isStarred, setIsStarred] = useState(false);
  const [starCount, setStarCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch initial star count and status
    fetch(`/api/prompts/${promptId}/stars`)
      .then(res => res.json())
      .then(data => {
        setStarCount(data.count);
        setIsStarred(data.isStarred);
      })
      .catch(console.error);
  }, [promptId]);

  const handleStar = async () => {
    try {
      const response = await fetch(`/api/prompts/${promptId}/star`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setIsStarred(!isStarred);
      setStarCount(prev => isStarred ? prev - 1 : prev + 1);

      toast({
        title: isStarred ? "Unstarred" : "Starred",
        description: isStarred ? "Removed star from prompt" : "Added star to prompt",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-2"
      onClick={handleStar}
    >
      <Star className={`h-4 w-4 ${isStarred ? "fill-yellow-400" : ""}`} />
      {starCount}
    </Button>
  );
}

function ForkButton({ promptId }: ComponentProps) {
  const [forkCount, setForkCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch initial fork count
    fetch(`/api/prompts/${promptId}/forks`)
      .then(res => res.json())
      .then(data => setForkCount(data.count))
      .catch(console.error);
  }, [promptId]);

  const handleFork = async () => {
    try {
      const response = await fetch(`/api/prompts/${promptId}/fork`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setForkCount(prev => prev + 1);

      toast({
        title: "Forked",
        description: "Successfully forked the prompt",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-2"
      onClick={handleFork}
    >
      <GitFork className="h-4 w-4" />
      {forkCount}
    </Button>
  );
}

function PromptContent({ prompt }: { prompt: any }) {
  return (
    <div className="space-y-4">
      <pre className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
        {prompt?.content}
      </pre>
      {prompt?.description && (
        <p className="text-muted-foreground">{prompt.description}</p>
      )}
    </div>
  );
}

function IssuesList({ promptId }: ComponentProps) {
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    fetch(`/api/prompts/${promptId}/issues`)
      .then(res => res.json())
      .then(setIssues)
      .catch(console.error);
  }, [promptId]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Issues</h3>
      {issues.length === 0 ? (
        <p className="text-muted-foreground">No issues reported yet.</p>
      ) : (
        <div>Issues list will be implemented here</div>
      )}
    </div>
  );
}

function DiscussionList({ promptId }: ComponentProps) {
  const [discussions, setDiscussions] = useState([]);

  useEffect(() => {
    fetch(`/api/prompts/${promptId}/discussions`)
      .then(res => res.json())
      .then(setDiscussions)
      .catch(console.error);
  }, [promptId]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Discussions</h3>
      {discussions.length === 0 ? (
        <p className="text-muted-foreground">No discussions yet.</p>
      ) : (
        <div>Discussions list will be implemented here</div>
      )}
    </div>
  );
}

function VersionHistory({ promptId }: ComponentProps) {
  const [versions, setVersions] = useState([]);

  useEffect(() => {
    fetch(`/api/prompts/${promptId}/versions`)
      .then(res => res.json())
      .then(setVersions)
      .catch(console.error);
  }, [promptId]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Version History</h3>
      {versions.length === 0 ? (
        <p className="text-muted-foreground">No version history available.</p>
      ) : (
        <div>Version history will be implemented here</div>
      )}
    </div>
  );
}

function PullRequestList({ promptId }: ComponentProps) {
  const [pullRequests, setPullRequests] = useState([]);

  useEffect(() => {
    fetch(`/api/prompts/${promptId}/pull-requests`)
      .then(res => res.json())
      .then(setPullRequests)
      .catch(console.error);
  }, [promptId]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Pull Requests</h3>
      {pullRequests.length === 0 ? (
        <p className="text-muted-foreground">No pull requests yet.</p>
      ) : (
        <div>Pull requests list will be implemented here</div>
      )}
    </div>
  );
}

export default function PromptDetail() {
  const { id } = useParams();
  const { prompt, isLoading } = usePrompt(id);
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!prompt) {
    return <div>Prompt not found</div>;
  }

  const promptId = Number(id);
  if (isNaN(promptId)) {
    return <div>Invalid prompt ID</div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <h1 className="text-3xl font-bold">{prompt?.title}</h1>
        <div className="flex gap-2">
          <StarButton promptId={promptId} />
          <ForkButton promptId={promptId} />
        </div>
      </div>

      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="discussions">Discussions</TabsTrigger>
          <TabsTrigger value="versions">Versions</TabsTrigger>
          <TabsTrigger value="pull-requests">Pull Requests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="content">
          <PromptContent prompt={prompt} />
        </TabsContent>
        
        <TabsContent value="issues">
          <IssuesList promptId={promptId} />
        </TabsContent>
        
        <TabsContent value="discussions">
          <DiscussionList promptId={promptId} />
        </TabsContent>
        
        <TabsContent value="versions">
          <VersionHistory promptId={promptId} />
        </TabsContent>
        
        <TabsContent value="pull-requests">
          <PullRequestList promptId={promptId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
