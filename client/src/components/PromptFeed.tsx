import { useState } from 'react';
import { usePrompts } from '../hooks/use-prompts';
import PromptCard from './PromptCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

const categories = ['Writing', 'Coding', 'Design', 'Business', 'Other'] as const;
type Category = typeof categories[number];

export default function PromptFeed() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | ''>('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'controversial' | 'trending'>('trending');
  
  const { prompts, isLoading, error } = usePrompts({ 
    sort: sortBy, 
    search: searchTerm,
    category: selectedCategory || undefined
  });

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value as Category | '');
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Select value={selectedCategory} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="text"
          placeholder="Search prompts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow"
        />
        <Button
          variant={sortBy === 'trending' ? 'default' : 'outline'}
          onClick={() => {
            setSortBy('trending');
            if (window.navigator.vibrate) {
              window.navigator.vibrate(50);
            }
          }}
          className="relative active:scale-95 transition-transform"
        >
          <TrendingUp className="mr-2 h-4 w-4" />
          Trending
        </Button>
        <Button
          variant={sortBy === 'recent' ? 'default' : 'outline'}
          onClick={() => {
            setSortBy('recent');
            if (window.navigator.vibrate) {
              window.navigator.vibrate(50);
            }
          }}
          className="relative active:scale-95 transition-transform"
        >
          <Clock className="mr-2 h-4 w-4" />
          Recent
        </Button>
        <Button
          variant={sortBy === 'popular' ? 'default' : 'outline'}
          onClick={() => {
            setSortBy('popular');
            if (window.navigator.vibrate) {
              window.navigator.vibrate(50);
            }
          }}
          className="relative active:scale-95 transition-transform"
        >
          Popular
        </Button>
        <Button
          variant={sortBy === 'controversial' ? 'default' : 'outline'}
          onClick={() => {
            setSortBy('controversial');
            if (window.navigator.vibrate) {
              window.navigator.vibrate(50);
            }
          }}
          className="relative active:scale-95 transition-transform"
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
