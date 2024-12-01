import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Prompt {
  id: number;
  title: string;
  content: string;
  description?: string;
}

interface PromptDialogProps {
  prompt: Prompt;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PromptDialog({ prompt, open, onOpenChange }: PromptDialogProps) {
  const { toast } = useToast();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(prompt.content);
    toast({
      title: "Copied",
      description: "Prompt copied to clipboard"
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">{prompt.title}</h2>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={copyToClipboard}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="prompt">
          <TabsList>
            <TabsTrigger value="prompt">Prompt</TabsTrigger>
            <TabsTrigger value="discussion">Discussion</TabsTrigger>
            <TabsTrigger value="issues">Issues</TabsTrigger>
            <TabsTrigger value="forks">Forks</TabsTrigger>
            <TabsTrigger value="versions">Versions</TabsTrigger>
            <TabsTrigger value="pull-requests">Pull Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="prompt">
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg relative">
                <pre className="whitespace-pre-wrap">{prompt.content}</pre>
              </div>
              {prompt.description && (
                <p className="text-muted-foreground">{prompt.description}</p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="discussion">
            <div className="p-4 text-muted-foreground">Discussion feature coming soon</div>
          </TabsContent>

          <TabsContent value="issues">
            <div className="p-4 text-muted-foreground">Issues feature coming soon</div>
          </TabsContent>

          <TabsContent value="forks">
            <div className="p-4 text-muted-foreground">Forks feature coming soon</div>
          </TabsContent>

          <TabsContent value="versions">
            <div className="p-4 text-muted-foreground">Version history coming soon</div>
          </TabsContent>

          <TabsContent value="pull-requests">
            <div className="p-4 text-muted-foreground">Pull requests coming soon</div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
