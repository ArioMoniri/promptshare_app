import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

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
        {issues.map((issue) => (
          <Card key={issue.id}>
            <CardHeader>
              <CardTitle>{issue.title}</CardTitle>
              <Badge>{issue.status}</Badge>
            </CardHeader>
            <CardContent>
              <p>{issue.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}