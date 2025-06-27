
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, staff, loading } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute check:', { 
    loading, 
    hasUser: !!user, 
    hasStaff: !!staff, 
    staffRole: staff?.role,
    requiredRole,
    currentPath: location.pathname 
  });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-48 mx-auto" />
            <Skeleton className="h-4 w-32 mx-auto" />
          </div>
          <p className="text-sm text-muted-foreground">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('No user, redirecting to auth');
    // Check if we're trying to access client dashboard
    if (location.pathname.startsWith('/client-dashboard')) {
      return <Navigate to="/client-auth" replace />;
    }
    return <Navigate to="/auth" replace />;
  }

  // For client routes, we don't need staff profile
  if (requiredRole === "Client") {
    return <>{children}</>;
  }

  // For staff routes, we need both user and staff profile
  if (!staff) {
    console.log('User exists but no staff profile found');
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="text-red-500">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="text-gray-600 max-w-md">
            Your account doesn't have the required permissions to access this area. 
            Please contact your administrator.
          </p>
          <button 
            onClick={() => window.location.href = "/auth"}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (requiredRole && staff.role !== requiredRole) {
    console.log('Role mismatch:', { required: requiredRole, actual: staff.role });
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Insufficient Permissions</h2>
          <p className="text-gray-600">You don't have the required role to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
