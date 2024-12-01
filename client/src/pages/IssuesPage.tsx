import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

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
    const response = await fetch(`/api/prompts/${id}/issues`);
    const data = await response.json();
    setIssues(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/prompts/${id}/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Issue</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Issue title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              placeholder="Issue description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Button type="submit">Create Issue</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {issues.map((issue) => (
          <Card key={issue.id}>
            <CardHeader>
              <CardTitle>{issue.title}</CardTitle>
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
