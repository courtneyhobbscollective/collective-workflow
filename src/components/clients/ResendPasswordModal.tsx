import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ResendPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientEmail: string;
}

export function ResendPasswordModal({ isOpen, onClose, clientEmail }: ResendPasswordModalProps) {
  const [email, setEmail] = useState(clientEmail);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Missing Information",
        description: "Please enter the email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Supabase will send a password reset email to this address
      // The user will be redirected to /reset-password after clicking the link in the email
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Password Reset Email Sent",
        description: `A password reset link has been sent to ${email}.`,
      });
      onClose();
    } catch (error: any) {
      console.error("Error sending password reset email:", error);
      toast({
        title: "Error Sending Email",
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
          <DialogTitle>Resend Password Reset</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleResend} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter the email address associated with the client's account to send a password reset link.
          </p>
          <div>
            <Label htmlFor="email">Client Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@example.com"
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Send Reset Link
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}