import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/ui/Logo";

export function ClientAuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false); // State to track successful login
  const { toast } = useToast();

  const handleSignIn = async (e: React.FormEvent) => {
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Check if the logged-in user is associated with a client profile
      const { data: clientProfile, error: profileError } = await supabase
        .from('client_profiles')
        .select('client_id')
        .eq('user_id', data.user?.id)
        .single();

      if (profileError || !clientProfile) {
        // If no client profile found, sign out and show error
        await supabase.auth.signOut();
        toast({
          title: "Login Failed",
          description: "Access denied. This account is not linked to a client.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Logged in successfully!",
      });
      setLoggedIn(true); // Set loggedIn to true on successful login
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Redirect to client dashboard on successful login
  if (loggedIn) {
    return <Navigate to="/client-dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Logo size="md" />
            </div>
            <CardTitle className="text-2xl font-bold">Client Login</CardTitle>
            <p className="text-muted-foreground">Sign in to your client account</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4 mr-2" />
                )}
                Sign In
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              <p>Don't have an account? Contact your account manager for access.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}