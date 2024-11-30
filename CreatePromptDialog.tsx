'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export default function CreatePromptDialog() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [sRef, setSRef] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission here (e.g., send data to API)
    console.log({ title, content, sRef })
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Create Prompt</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a New Prompt</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="content">Prompt Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              className="min-h-[100px]"
            />
          </div>
          <div>
            <Label htmlFor="sRef">sRef Code (for Midjourney)</Label>
            <Input
              id="sRef"
              value={sRef}
              onChange={(e) => setSRef(e.target.value)}
              placeholder="Optional: Add sRef code for Midjourney prompts"
            />
          </div>
          <Button type="submit">Create Prompt</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

