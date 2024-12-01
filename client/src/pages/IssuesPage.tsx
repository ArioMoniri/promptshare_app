import { useState, useEffect } from 'react';
import { useParams, Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface Issue {
  id: number;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  user: {
    id: number;
    username: string;
    avatar: string | null;
  };
}

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

  const handleSubmit = async (e) => {
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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Report Issue</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Issue title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <Textarea
                placeholder="Issue description"
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
        {issues.map((issue: Issue) => (
          <Card key={issue.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle>{issue.title}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Link href={`/profile/${issue.user.id}`}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={issue.user.avatar || undefined} />
                          <AvatarFallback>{issue.user.username[0]}</AvatarFallback>
                        </Avatar>
                        {issue.user.username}
                      </div>
                    </Link>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
                <Badge variant={issue.status === 'open' ? 'destructive' : 'secondary'}>
                  {issue.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{issue.description}</p>
            </CardContent>
          </Card>
        ))}
        {issues.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No issues reported yet
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}