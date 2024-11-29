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

  const handleTest = async () => {
    if (!testInput) return;
    
    setTesting(true);
    try {
      // Replace variables in the prompt with actual test input
      const processedPrompt = content.replace(/\{input\}/g, testInput);
      const result = await testPrompt(processedPrompt);
      
      setTestHistory(prev => [...prev, {
        input: testInput,
        output: result.output,
        timestamp: new Date()
      }]);
      
      setTestInput("");
      
      toast({
        title: "Test successful",
        description: "Your prompt works as expected",
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
        title: "Error",
        description: "Title and content are required",
      });
      return;
    }

    try {
      await createPrompt({
        title,
        content,
        description,
        tags: [] as string[],
      });
      toast({
        title: "Success",
        description: "Your prompt has been published",
      });
      onClose();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
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
          <div className="space-y-4">
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
          </div>

          {/* Right side - Testing Interface */}
          <div className="flex flex-col h-full border rounded-lg overflow-hidden">
            <div className="p-4 border-b bg-muted">
              <h3 className="font-semibold">Test Your Prompt</h3>
            </div>
            
            {/* Chat history */}
            <ScrollArea className="flex-1 p-4">
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
            <div className="p-4 border-t">
              <Button onClick={() => setTestInput(content)} variant="outline" className="mb-2">
                Test Current Prompt
              </Button>
              <div className="flex gap-2">
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
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={handleSave}>Save Prompt</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
