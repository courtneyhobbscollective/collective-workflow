import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { SupabaseProvider } from './context/SupabaseContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout/Layout';
import AuthContainer from './components/Auth/AuthContainer';
import ResetPassword from './components/Auth/ResetPassword';
import Dashboard from './components/Dashboard/Dashboard';
import ClientsPage from './components/Clients/ClientsPage';
import BriefWorkflow from './components/Briefs/BriefWorkflow';
import CalendarPage from './components/Calendar/CalendarPage';
import ChatPage from './components/Chat/ChatPage';
import BillingPage from './components/Billing/BillingPage';
import StaffPage from './components/Staff/StaffPage';
import LoginDebug from './components/Auth/LoginDebug';

const ForceResetPasswordRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  // Check for access_token in hash or query string, or type=recovery in hash or search
  const hashParams = new URLSearchParams(location.hash.replace('#', '?'));
  const queryParams = new URLSearchParams(location.search);
  const hasAccessToken = hashParams.get('access_token') || queryParams.get('access_token');
  const isRecovery = location.hash.includes('type=recovery') || location.search.includes('type=recovery');
  if ((location.pathname === '/reset-password' || location.pathname === '/reset-password/') && (hasAccessToken || isRecovery)) {
    return <ResetPassword />;
  }
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <ForceResetPasswordRoute>
        <Routes>
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/reset-password/" element={<ResetPassword />} />
          {!user ? (
            <Route path="*" element={<AuthContainer />} />
          ) : (
            <Route path="*" element={
              <AppProvider>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    {user.role === 'admin' && (
                      <>
                        <Route path="/clients" element={<ClientsPage />} />
                        <Route path="/billing" element={<BillingPage />} />
                        <Route path="/staff" element={<StaffPage />} />
                      </>
                    )}
                    <Route path="/briefs" element={<BriefWorkflow />} />
                    <Route path="/calendar" element={<CalendarPage />} />
                    <Route path="/chat" element={<ChatPage />} />
                  </Routes>
                </Layout>
              </AppProvider>
            } />
          )}
        </Routes>
      </ForceResetPasswordRoute>
    </Router>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <SupabaseProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </SupabaseProvider>
    </ErrorBoundary>
  );
}

export default App;