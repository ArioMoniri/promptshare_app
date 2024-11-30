import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import PromptCard from "@/components/PromptCard";
import { usePrompts } from "@/hooks/use-prompts";
import { Loader2 } from "lucide-react";

const categories = [
  'Writing',
  'Coding', 
  'Design',
  'Business',
  'Other'
] as const;

export type PromptCategory = typeof categories[number];

export default function CategoriesPage() {
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const { prompts, isLoading } = usePrompts();

  const filteredPrompts = prompts?.filter(prompt => 
    (!selectedCategory || prompt.tags?.includes(selectedCategory)) &&
    (prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     prompt.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-bold">Browse Prompts by Category</h1>
        <p className="text-muted-foreground">
          Explore and discover AI prompts across different categories
        </p>
      </div>

      <div className="flex gap-4 flex-col sm:flex-row">
        <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as PromptCategory)}>
          <SelectTrigger className="w-[200px]">
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
          className="flex-1"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPrompts?.map((prompt) => (
          <PromptCard 
            key={prompt.id} 
            prompt={prompt}
          />
        ))}
      </div>

      {filteredPrompts?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No prompts found matching your criteria</p>
        </div>
      )}
    </div>
  );
}
