'use client'

import { useState } from 'react'
import PromptCard from './PromptCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// This would typically come from an API
const mockPrompts = [
  {
    id: '1',
    title: 'Creative Writing Prompt',
    content: 'Write a short story about a world where gravity reverses every 12 hours.',
    author: {
      name: 'Alice Johnson',
      image: '/placeholder-avatar.jpg',
    },
    promotions: 42,
    comments: 7,
    issues: 1,
    forks: 3,
    stars: 15,
    tags: ['writing', 'creative', 'sci-fi'],
  },
  {
    id: '2',
    title: 'Code Optimization Challenge',
    content: 'Optimize this Python function for better performance without changing its output.',
    author: {
      name: 'Bob Smith',
      image: '/placeholder-avatar.jpg',
    },
    promotions: 31,
    comments: 12,
    issues: 2,
    forks: 5,
    stars: 20,
    tags: ['python', 'optimization', 'coding'],
  },
  // Add more mock prompts as needed
]

export default function PromptFeed() {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('recent')

  const filteredPrompts = mockPrompts.filter(prompt =>
    prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prompt.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prompt.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const sortedPrompts = [...filteredPrompts].sort((a, b) => {
    if (sortBy === 'popular') return b.promotions - a.promotions
    if (sortBy === 'controversial') return b.issues - a.issues
    return 0 // 'recent' - assume the array is already sorted by recency
  })

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Input
          type="text"
          placeholder="Search prompts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow"
        />
        <Button
          variant={sortBy === 'recent' ? 'default' : 'outline'}
          onClick={() => setSortBy('recent')}
        >
          Recent
        </Button>
        <Button
          variant={sortBy === 'popular' ? 'default' : 'outline'}
          onClick={() => setSortBy('popular')}
        >
          Popular
        </Button>
        <Button
          variant={sortBy === 'controversial' ? 'default' : 'outline'}
          onClick={() => setSortBy('controversial')}
        >
          Controversial
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sortedPrompts.map((prompt) => (
          <PromptCard key={prompt.id} {...prompt} />
        ))}
      </div>
    </div>
  )
}

