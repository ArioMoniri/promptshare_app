import { useState, useMemo } from "react";
import { useUser } from "../hooks/use-user";
import { usePrompts } from "../hooks/use-prompts";
import PromptCard from "../components/PromptCard";
import PromptEditor from "../components/PromptEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, TrendingUp, Clock, Search } from "lucide-react";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function HomePage() {
  const { user } = useUser();
  const { prompts, isLoading, error } = usePrompts();
  const [showEditor, setShowEditor] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'trending' | 'recent'>('trending');

  const filteredResults = useMemo(() => {
    setIsSearching(true);
    try {
      if (!searchQuery.trim() || !prompts) {
        setIsSearching(false);
        return { profiles: [], prompts: [] };
      }
      
      const query = searchQuery.toLowerCase();
      
      // Find matching profiles
      const profiles = new Set();
      const matchingPrompts = prompts.filter(prompt => {
        const matches = 
          prompt.title?.toLowerCase().includes(query) ||
          prompt.description?.toLowerCase().includes(query) ||
          prompt.content?.toLowerCase().includes(query);
        
        if (prompt.user?.username?.toLowerCase().includes(query)) {
          profiles.add(prompt.user);
        }
        
        return matches;
      });
      
      // Filter prompts based on current tab
      const tabPrompts = activeTab === 'trending' 
        ? matchingPrompts
            .sort((a, b) => {
              const aScore = (a.upvotes ?? 0) + (a.comments?.length ?? 0);
              const bScore = (b.upvotes ?? 0) + (b.comments?.length ?? 0);
              return bScore - aScore;
            })
        : matchingPrompts
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setIsSearching(false);
      return {
        profiles: Array.from(profiles),
        prompts: tabPrompts
      };
    } catch (error) {
      setIsSearching(false);
      return { profiles: [], prompts: [] };
    }
  }, [prompts, searchQuery, activeTab]);

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

      <Tabs defaultValue="trending" className="space-y-4" onValueChange={(value) => setActiveTab(value as 'trending' | 'recent')}>
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

        {searchQuery && (
          <div className="space-y-4">
            {filteredResults.profiles.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Matching Profiles</h3>
                <div className="flex gap-4">
                  {filteredResults.profiles.map(profile => (
                    <Link key={profile.id} href={`/profile/${profile.id}`}>
                      <div className="flex items-center gap-2 p-2 rounded-lg border hover:bg-accent">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={profile.avatar || undefined} alt={profile.username} />
                          <AvatarFallback>{profile.username[0]}</AvatarFallback>
                        </Avatar>
                        <span>{profile.username}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Matching Prompts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(filteredResults.prompts ?? []).map(prompt => (
                  <PromptCard key={prompt.id} prompt={prompt} />
                ))}
              </div>
            </div>
          </div>
        )}

        {!searchQuery && (
          <>
            <TabsContent value="trending">
              {isLoading || isSearching ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-[300px] rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              ) : error ? (
                <div className="text-center text-destructive">
                  Failed to load prompts. Please try again later.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(filteredResults.prompts ?? []).map((prompt) => (
                    <PromptCard key={prompt.id} prompt={prompt} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="recent">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(filteredResults.prompts ?? []).map((prompt) => (
                  <PromptCard key={prompt.id} prompt={prompt} />
                ))}
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>

      {showEditor && (
        <PromptEditor onClose={() => setShowEditor(false)} />
      )}
    </div>
  );
}
