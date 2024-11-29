import { useState } from "react";
import { useUser } from "../hooks/use-user";
import { usePrompts } from "../hooks/use-prompts";
import PromptCard from "../components/PromptCard";
import PromptEditor from "../components/PromptEditor";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, TrendingUp, Clock } from "lucide-react";

export default function HomePage() {
  const { user } = useUser();
  const { prompts, isLoading } = usePrompts();
  const [showEditor, setShowEditor] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Prompt Engineering Hub</h1>
        <Button onClick={() => setShowEditor(true)} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Create Prompt
        </Button>
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
            {prompts?.filter(p => (p.likes ?? 0) > 0)
              .sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))
              .map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="recent">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {prompts?.sort((a, b) => 
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
