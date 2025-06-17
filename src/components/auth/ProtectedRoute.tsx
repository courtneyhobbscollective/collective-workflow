import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'Admin' | 'Staff' | 'Client';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, staff, clientProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // If no user is logged in, redirect to appropriate login page
  if (!user) {
    return <Navigate to={requiredRole === "Client" ? "/client-auth" : "/auth"} replace />;
  }

  // User is logged in, now check roles and required access
  if (requiredRole === "Client") {
    // If this route requires a client role, check if clientProfile exists
    if (clientProfile) {
      return <>{children}</>;
    } else {
      // User is logged in but not a client, redirect to staff login or access denied
      return <Navigate to="/auth" replace />; // Or show an access denied message
    }
  } else {
    // This route requires Admin/Staff role, or no specific role (like the root '/')
    if (staff) {
      // If a specific staff role is required, check it
      if (requiredRole && staff.role !== requiredRole && requiredRole !== 'Staff') { // 'Staff' role covers both Admin and regular Staff for general access
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
              <p className="text-muted-foreground">You don't have permission to access this page.</p>
            </div>
          </div>
        );
      }
      // Staff user is authorized for this route
      return <>{children}</>;
    } else if (clientProfile) {
      // User is a client, but trying to access a non-client route (e.g., '/')
      // Redirect them to their client dashboard
      return <Navigate to="/client-dashboard" replace />;
    } else {
      // User is logged in but has neither a staff nor a client profile (unassigned or new user)
      // Redirect to staff login for now, or a dedicated onboarding page
      return <Navigate to="/auth" replace />;
    }
  }
}