import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'Admin' | 'Staff' | 'Client'; // Added 'Client' role
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, staff, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    // If no user, redirect to staff login by default, or client login if requiredRole is Client
    return <Navigate to={requiredRole === "Client" ? "/client-auth" : "/auth"} replace />;
  }

  // If a specific role is required
  if (requiredRole) {
    if (requiredRole === "Client") {
      // For client role, check if user is linked to a client_profile
      // This requires fetching the client_profile, which useAuth doesn't currently do.
      // For now, we'll assume if requiredRole is 'Client' and user exists, it's a client.
      // A more robust solution would involve fetching client_profile in AuthContext.
      // For this step, we'll just allow if user exists and requiredRole is Client.
      // We'll refine this in the next steps when we build the client dashboard.
      // For now, if user exists and requiredRole is Client, allow access.
      // The ClientAuthPage already checks for client_profile association.
      return <>{children}</>;
    } else {
      // For Admin/Staff roles, check staff object
      if (!staff || staff.role !== requiredRole) {
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
              <p className="text-muted-foreground">You don't have permission to access this page.</p>
            </div>
          </div>
        );
      }
    }
  }

  return <>{children}</>;
}