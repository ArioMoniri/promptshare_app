import { usePrompts } from '../hooks/use-prompts';
import PromptCard from '../components/PromptCard';
import { Loader2 } from "lucide-react";

export default function TrendingPage() {
  const { prompts, isLoading } = usePrompts({ sort: 'trending' });
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Trending Prompts</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {prompts?.map((prompt) => (
          <PromptCard key={prompt.id} prompt={prompt} />
        ))}
      </div>
    </div>
  );
}
