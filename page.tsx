'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import TestPrompt from '@/app/components/TestPrompt'

// This would typically come from an API based on the prompt ID
const mockPrompt = {
  id: '1',
  title: 'Creative Writing Prompt',
  description: 'Write a short story about a world where gravity reverses every 12 hours.',
  content: 'You are a creative writer. Write a short story about a world where gravity reverses every 12 hours. Consider the implications on daily life, architecture, and society.',
}

export default function TestPromptPage({ params }: { params: { id: string } }) {
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">{mockPrompt.title}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Prompt Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{mockPrompt.description}</p>
          </CardContent>
        </Card>
        <TestPrompt initialPrompt={mockPrompt.content} />
      </div>
    </div>
  )
}

