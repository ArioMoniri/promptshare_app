import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ThumbsUp, MessageSquare, AlertTriangle } from 'lucide-react'

interface PromptCardProps {
  id: string
  title: string
  content: string
  author: string
  promotions: number
  comments: number
  issues: number
}

export default function PromptCard({ id, title, content, author, promotions, comments, issues }: PromptCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-gray-500">by {author}</p>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700">{content.substring(0, 100)}...</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" size="sm">
          <ThumbsUp className="mr-2 h-4 w-4" />
          {promotions}
        </Button>
        <Button variant="ghost" size="sm">
          <MessageSquare className="mr-2 h-4 w-4" />
          {comments}
        </Button>
        <Button variant="ghost" size="sm">
          <AlertTriangle className="mr-2 h-4 w-4" />
          {issues}
        </Button>
        <Button asChild>
          <Link href={`/prompt/${id}`}>View</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

