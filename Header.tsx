import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Header() {
  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-6 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-gray-800">
          PromptShare
        </Link>
        <nav>
          <ul className="flex space-x-4">
            <li>
              <Link href="/trending" className="text-gray-600 hover:text-gray-800">
                Trending
              </Link>
            </li>
            <li>
              <Button asChild>
                <Link href="/create">Create Prompt</Link>
              </Button>
            </li>
            <li>
              <Button variant="outline" asChild>
                <Link href="/login">Login</Link>
              </Button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}

