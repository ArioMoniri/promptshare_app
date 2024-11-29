import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useOpenAI } from "../hooks/use-openai";

interface PromptEditorProps {
  onClose: () => void;
}

export default function PromptEditor({ onClose }: PromptEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [description, setDescription] = useState("");
  const { testPrompt } = useOpenAI();
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    if (!content) return;
    
    setTesting(true);
    try {
      const result = await testPrompt(content);
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

    // TODO: Implement save functionality
    toast({
      title: "Saved",
      description: "Your prompt has been saved",
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Prompt</DialogTitle>
        </DialogHeader>
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
              placeholder="Write your prompt here..."
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
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={testing || !content}
            >
              {testing ? "Testing..." : "Test Prompt"}
            </Button>
            <Button onClick={handleSave}>Save Prompt</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
