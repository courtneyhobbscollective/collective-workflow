import { useState, useEffect } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/ui/Logo";
import { Footer } from "@/components/layout/Footer";

interface InvitationData {
  id: string;
  email: string;
  staff_id: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  created_by: string;
  name: string;
  role: string;
  profile_picture_url: string | null;
  invitation_status: string;
}

export function PasswordSetupPage() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [completed, setCompleted] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { toast } = useToast();

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      console.log('No token provided in URL');
      setValidationError('No invitation token provided');
      setValidating(false);
    }
  }, [token]);

  const validateToken = async () => {
    try {
      console.log('Validating token:', token);
      
      // Query with proper RPC call - handle as array since that's what the function returns
      const { data: invitationData, error: invitationError } = await supabase
        .rpc('validate_invitation_token', { token_param: token as string });

      console.log('Invitation query result:', { invitationData, invitationError });

      if (invitationError) {
        console.error('Error fetching invitation:', invitationError);
        setValidationError('Failed to validate invitation');
        toast({
          title: "Error",
          description: "Failed to validate invitation.",
          variant: "destructive",
        });
        setValidating(false);
        return;
      }

      // The RPC function returns an array, so we need to check if it has any results
      if (!invitationData || invitationData.length === 0) {
        console.log('No valid invitation found for token');
        setValidationError('This invitation link is invalid or has expired');
        toast({
          title: "Invalid Invitation",
          description: "This invitation link is invalid or has expired.",
          variant: "destructive",
        });
        setValidating(false);
        return;
      }

      // Get the first (and only) result from the array
      const invitationRecord = invitationData[0];
      console.log('Validation successful, setting invitation data:', invitationRecord);
      setInvitation(invitationRecord as InvitationData);
      setValidationError(null);
    } catch (error) {
      console.error('Error validating token:', error);
      setValidationError('Failed to validate invitation');
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
    
    if (!invitation) return;
    
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
          emailRedirectTo: `${import.meta.env.VITE_PUBLIC_APP_URL}/setup-password` // Use environment variable
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

  // Show loading while validating
  if (validating) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p className="text-muted-foreground">Validating invitation...</p>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // Show error state if validation failed
  if (validationError || !invitation) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Invalid Invitation</CardTitle>
              <p className="text-muted-foreground">
                {validationError || 'This invitation link is not valid.'}
              </p>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild variant="outline">
                <a href="/auth">Back to Login</a>
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // Show success state if completed
  if (completed) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1 flex items-center justify-center p-4">
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
        <Footer />
      </div>
    );
  }

  // Show password setup form
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <Card className="w-full">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Logo size="md" />
              </div>
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
      </div>
      <Footer />
    </div>
  );
}