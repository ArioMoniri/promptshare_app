import PromptCard from './components/PromptCard'

// This would typically come from a database
const mockPrompts = [
  {
    id: '1',
    title: 'Creative Writing Prompt',
    content: 'Write a short story about a world where gravity reverses every 12 hours.',
    author: 'Alice Johnson',
    promotions: 42,
    comments: 7,
    issues: 1,
  },
  {
    id: '2',
    title: 'Code Optimization Challenge',
    content: 'Optimize this Python function for better performance without changing its output.',
    author: 'Bob Smith',
    promotions: 31,
    comments: 12,
    issues: 2,
  },
  // Add more mock prompts as needed
]

export default function Home() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {mockPrompts.map((prompt) => (
        <PromptCard key={prompt.id} {...prompt} />
      ))}
    </div>
  )
}

