'use client'

import PromptCard from '@/components/PromptCard'
import { usePrompts } from '@/hooks/use-prompts'

export default function Home() {
  const { prompts } = usePrompts()

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {prompts?.map((prompt) => (
        <PromptCard 
          key={prompt.id} 
          {...prompt}
        />
      ))}
    </div>
  )
}
