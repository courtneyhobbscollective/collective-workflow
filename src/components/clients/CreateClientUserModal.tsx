import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface CreateClientUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: {
    id: string;
    name: string;
    company: string;
    email?: string; // Suggest client's email
  };
  onUserCreated: () => void;
}

export function CreateClientUserModal({ isOpen, onClose, client, onUserCreated }: CreateClientUserModalProps) {
  const [email, setEmail] = useState(client.email || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // 1. Create user in Supabase Auth
      // Note: Using supabase.auth.signUp will log in the current user as the new client user.
      // For a more robust solution in a production environment, consider using a Supabase Edge Function
      // with supabase.auth.admin.createUser to avoid this behavior.
      const { data: userData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      if (!userData.user) {
        throw new Error("User creation failed, no user data returned.");
      }

      // 2. Link user to client in client_profiles table
      const { error: profileError } = await supabase
        .from('client_profiles')
        .insert({
          user_id: userData.user.id,
          client_id: client.id,
        });

      if (profileError) {
        // If linking fails, attempt to delete the auth user to prevent orphaned users
        // This requires admin privileges, which might not be available client-side.
        // For now, we'll just log the error.
        console.error("Failed to link user to client profile, consider manual cleanup of auth user:", profileError);
        throw profileError;
      }

      toast({
        title: "Client User Created",
        description: `User ${email} created and linked to ${client.company}. Please share the password with them.`,
      });
      onUserCreated();
      onClose();
    } catch (error: any) {
      console.error("Error creating client user:", error);
      toast({
        title: "Error Creating User",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create User for {client.company}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Create a login for {client.company} to access their client portal.
          </p>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@example.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Temporary Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Set a temporary password"
              required
              minLength={6}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Create User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}