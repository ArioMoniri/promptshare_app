import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useOpenAI } from "../hooks/use-openai";
import { usePrompts } from "../hooks/use-prompts";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, Send, User } from "lucide-react";

interface PromptEditorProps {
  onClose: () => void;
}

interface TestResult {
  input: string;
  output: string;
  timestamp: Date;
}

export default function PromptEditor({ onClose }: PromptEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [description, setDescription] = useState("");
  const [testInput, setTestInput] = useState("");
  const [testHistory, setTestHistory] = useState<TestResult[]>([]);
  const { testPrompt } = useOpenAI();
  const { createPrompt } = usePrompts();
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleTest = async () => {
    if (!testInput) return;
    setTesting(true);
    try {
      const result = await testPrompt(testInput);
      setTestHistory(prev => [...prev, {
        input: testInput,
        output: result.output,
        timestamp: new Date()
      }]);
      setTestInput("");
      toast({
        title: "Test completed",
        description: "Your prompt has been tested successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Test failed",
        description: error.message,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!title || !content) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Title and prompt content are required fields.",
      });
      return;
    }

    setSaving(true);
    try {
      await createPrompt({
        title,
        content,
        description,
        tags: [],
      });
      toast({
        title: "Success",
        description: "Your prompt has been saved successfully.",
      });
      onClose();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: error.message || "Failed to save prompt. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New Prompt</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
          {/* Left side - Prompt Editor */}
          <Card className="p-4">
            <CardHeader className="px-0 pt-0">
              <h3 className="text-lg font-semibold">Prompt Details</h3>
            </CardHeader>
            <CardContent className="px-0 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a descriptive title"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Prompt</label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your prompt here... Use {input} for variable input"
                  className="h-32 font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what your prompt does..."
                  className="h-24"
                />
              </div>
            </CardContent>
          </Card>

          {/* Right side - Testing Interface */}
          <Card className="flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Test Your Prompt</CardTitle>
            </CardHeader>
            
            {/* Chat history */}
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-4">
                {testHistory.map((result, index) => (
                  <div key={index} className="space-y-4">
                    {/* User message */}
                    <div className="flex gap-3 items-start">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-muted rounded-lg p-3 flex-1">
                        <p className="text-sm">{result.input}</p>
                      </div>
                    </div>
                    
                    {/* AI response */}
                    <div className="flex gap-3 items-start">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary">
                          <Bot className="h-4 w-4 text-primary-foreground" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-primary/10 rounded-lg p-3 flex-1">
                        <pre className="text-sm whitespace-pre-wrap">{result.output}</pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Input area */}
            <CardFooter className="flex flex-col gap-2 border-t">
              <Button 
                onClick={() => setTestInput(content)} 
                variant="outline" 
                className="w-full"
                disabled={!content}
              >
                Test Current Prompt
              </Button>
              <div className="flex gap-2 w-full">
                <Input
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder="Enter test input..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleTest();
                    }
                  }}
                />
                <Button
                  onClick={handleTest}
                  disabled={testing || !testInput}
                  className="shrink-0"
                >
                  {testing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Prompt"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
