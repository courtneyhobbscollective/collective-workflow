import { useState, useEffect } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function PasswordSetupPage() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [completed, setCompleted] = useState(false);
  const { toast } = useToast();

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      console.log('No token provided in URL');
      setValidating(false);
    }
  }, [token]);

  const validateToken = async () => {
    try {
      console.log('Validating token:', token);
      
      // Query with proper time comparison using rpc call for server-side validation
      const { data: invitationData, error: invitationError } = await supabase
        .rpc('validate_invitation_token', { token_param: token });

      console.log('Invitation query result:', { invitationData, invitationError });

      if (invitationError) {
        console.error('Error fetching invitation:', invitationError);
        toast({
          title: "Error",
          description: "Failed to validate invitation.",
          variant: "destructive",
        });
        setValidating(false);
        return;
      }

      if (!invitationData || invitationData.length === 0) {
        console.log('No valid invitation found for token');
        toast({
          title: "Invalid Invitation",
          description: "This invitation link is invalid or has expired.",
          variant: "destructive",
        });
        setValidating(false);
        return;
      }

      const combinedData = invitationData[0];
      console.log('Validation successful, setting invitation data:', combinedData);
      setInvitation(combinedData);
    } catch (error) {
      console.error('Error validating token:', error);
      toast({
        title: "Error",
        description: "Failed to validate invitation.",
        variant: "destructive",
      });
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log('Creating auth user for email:', invitation.email);
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      console.log('Auth signup result:', { authData, authError });

      if (authError) throw authError;

      // Mark invitation as accepted
      const { error: updateInvitationError } = await supabase
        .from('staff_invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitation.id);

      if (updateInvitationError) {
        console.error('Error updating invitation:', updateInvitationError);
      }

      // Update staff status
      const { error: updateStaffError } = await supabase
        .from('staff')
        .update({ invitation_status: 'accepted' })
        .eq('id', invitation.staff_id);

      if (updateStaffError) {
        console.error('Error updating staff status:', updateStaffError);
      }

      setCompleted(true);
      
      toast({
        title: "Account Created",
        description: "Your account has been created successfully. You can now sign in.",
      });

    } catch (error: any) {
      console.error('Error setting up password:', error);
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to set up your account.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!token || !invitation) {
    return <Navigate to="/auth" replace />;
  }

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Setup Complete!</CardTitle>
            <p className="text-muted-foreground">Your account has been created successfully.</p>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <a href="/auth">Sign In Now</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Set Up Your Password</CardTitle>
          <p className="text-muted-foreground">
            Welcome {invitation.name}! Please set up your password to complete your account.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email (Read-only)</Label>
              <Input
                id="email"
                type="email"
                value={invitation.email}
                disabled
                className="bg-gray-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter a secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Create Account
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
