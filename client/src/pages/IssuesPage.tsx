import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

export default function IssuesPage() {
  const { id } = useParams();
  const [issues, setIssues] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchIssues();
  }, [id]);

  const fetchIssues = async () => {
    try {
      const response = await fetch(`/api/prompts/${id}/issues`);
      const data = await response.json();
      setIssues(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch issues"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/prompts/${id}/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, description }),
      });
      
      if (!response.ok) throw new Error('Failed to create issue');
      
      const newIssue = await response.json();
      setIssues([...issues, newIssue]);
      setTitle('');
      setDescription('');
      
      toast({
        title: 'Success',
        description: 'Issue created successfully',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create issue',
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Report Issue</CardTitle>
          <CardDescription>
            Report bugs, suggest improvements, or request features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Brief description of the issue"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Detailed explanation of the issue"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <Button type="submit">Submit Issue</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Existing Issues</h2>
        {issues.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No issues reported yet
            </CardContent>
          </Card>
        ) : (
          issues.map((issue) => (
            <Card key={issue.id}>
              <CardHeader>
                <CardTitle>{issue.title}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant={issue.status === 'open' ? 'destructive' : 'secondary'}>
                    {issue.status}
                  </Badge>
                  <span>by {issue.user?.username}</span>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{issue.description}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
