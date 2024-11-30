import { useState } from 'react';
import { usePrompts } from '@/hooks/use-prompts';
import PromptCard from './PromptCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

export default function PromptFeed() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'controversial'>('recent');
  const { prompts, isLoading, error } = usePrompts({ sort: sortBy, search: searchTerm });

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
      
      {error && (
        <div className="text-destructive text-center py-4">
          Failed to load prompts
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {prompts?.map((prompt) => (
            <PromptCard 
              key={prompt.id}
              prompt={prompt}
              compact
            />
          ))}
        </div>
      )}
    </div>
  );
}
