'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Search } from 'lucide-react'

// Mock data - replace with actual search functionality
const mockSearchResults = [
  { type: 'user', name: 'John Doe', username: 'johndoe' },
  { type: 'tag', name: 'writing' },
  { type: 'prompt', title: 'Creative Writing Prompt', description: 'Write a short story about...' },
  // ... more mock results
]

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Implement actual search logic here
    console.log('Searching for:', searchTerm)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Search className="h-4 w-4" />
          Search
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Global Search</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSearch} className="space-y-4">
          <Input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button type="submit">Search</Button>
        </form>
        <div className="mt-4">
          <h3 className="text-sm font-semibold mb-2">Results</h3>
          <ul className="space-y-2">
            {mockSearchResults.map((result, index) => (
              <li key={index} className="text-sm">
                <span className="font-semibold">{result.type}: </span>
                {result.type === 'user' && `${result.name} (@${result.username})`}
                {result.type === 'tag' && `#${result.name}`}
                {result.type === 'prompt' && `${result.title} - ${result.description}`}
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}

