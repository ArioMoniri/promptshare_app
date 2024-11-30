'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

interface TestPromptProps {
  initialPrompt: string
}

export default function TestPrompt({ initialPrompt }: TestPromptProps) {
  const [prompt, setPrompt] = useState(initialPrompt)
  const [response, setResponse] = useState('')

  const handleTest = async () => {
    // In a real application, you would call your AI service here
    setResponse('This is a mock response from the AI. Replace this with actual AI integration.')
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Test Prompt</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt here"
          className="min-h-[100px] mb-4"
        />
        <Button onClick={handleTest} className="w-full">Test Prompt</Button>
      </CardContent>
      {response && (
        <CardFooter>
          <div className="w-full">
            <h4 className="font-semibold mb-2">AI Response:</h4>
            <p className="text-sm text-muted-foreground">{response}</p>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}

