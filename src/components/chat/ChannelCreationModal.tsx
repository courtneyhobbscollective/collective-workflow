import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ChannelCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChannelCreated: () => void;
  clients: Array<{ id: string; name: string; company: string }>;
}

export function ChannelCreationModal({ isOpen, onClose, onChannelCreated, clients }: ChannelCreationModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('channels')
        .insert([{
          name: name.trim(),
          description: description.trim() || null,
          client_id: clientId,
          created_by: "Staff Member", // In a real app, this would come from auth
          is_general: false
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Channel created successfully",
      });

      setName("");
      setDescription("");
      setClientId(null);
      onChannelCreated();
      onClose();
    } catch (error) {
      console.error('Error creating channel:', error);
      toast({
        title: "Error",
        description: "Failed to create channel",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Channel</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="channel-name">Channel Name</Label>
            <Input
              id="channel-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., project-updates"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="channel-description">Description (Optional)</Label>
            <Textarea
              id="channel-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this channel for?"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="client-select">Link to Client (Optional)</Label>
            <Select value={clientId || "none-client"} onValueChange={(value) => setClientId(value === "none-client" ? null : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a client (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none-client">No specific client</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.company} ({client.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? "Creating..." : "Create Channel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}