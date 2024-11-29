import { useState, useMemo } from "react";
import { useUser } from "../hooks/use-user";
import { usePrompts } from "../hooks/use-prompts";
import PromptCard from "../components/PromptCard";
import PromptEditor from "../components/PromptEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, TrendingUp, Clock, Search } from "lucide-react";

export default function HomePage() {
  const { user } = useUser();
  const { prompts, isLoading } = usePrompts();
  const [showEditor, setShowEditor] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPrompts = useMemo(() => {
    if (!searchQuery.trim() || !prompts) return prompts;
    
    const query = searchQuery.toLowerCase();
    return prompts.filter(prompt => 
      prompt.title?.toLowerCase().includes(query) ||
      prompt.description?.toLowerCase().includes(query) ||
      prompt.content?.toLowerCase().includes(query) ||
      prompt.user?.username?.toLowerCase().includes(query)
    );
  }, [prompts, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Prompt Engineering Hub</h1>
          <Button onClick={() => setShowEditor(true)} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Create Prompt
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search prompts by title, description, content, or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Tabs defaultValue="trending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trending" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="recent" className="gap-2">
            <Clock className="h-4 w-4" />
            Recent
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trending">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrompts?.filter(p => (p.likes ?? 0) > 0)
              .sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))
              .map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="recent">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrompts?.sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            ).map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {showEditor && (
        <PromptEditor onClose={() => setShowEditor(false)} />
      )}
    </div>
  );
}
