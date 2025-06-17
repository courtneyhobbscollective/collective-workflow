import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ClientProfile {
  client_id: string;
  client: {
    company: string;
    name: string;
  };
}

export function ClientDashboardPage() {
  const { user } = useAuth();
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchClientProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('client_profiles')
          .select(`
            client_id,
            client:clients(company, name)
          `)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setClientProfile(data);
      } catch (error: any) {
        console.error("Error fetching client profile:", error);
        toast({
          title: "Error",
          description: "Failed to load client profile.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchClientProfile();
  }, [user, toast]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading client dashboard...</p>
      </div>
    );
  }

  if (!clientProfile) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>No client profile found for this user.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-foreground">
        Welcome, {clientProfile.client.name} from {clientProfile.client.company}!
      </h2>
      <p className="text-muted-foreground">This is your client dashboard.</p>

      <Card>
        <CardHeader>
          <CardTitle>Your Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Your projects will appear here soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}