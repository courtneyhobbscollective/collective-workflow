import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { SupabaseProvider } from './context/SupabaseContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout/Layout';
import AuthContainer from './components/Auth/AuthContainer';
import Dashboard from './components/Dashboard/Dashboard';
import ClientsPage from './components/Clients/ClientsPage';
import BriefWorkflow from './components/Briefs/BriefWorkflow';
import CalendarPage from './components/Calendar/CalendarPage';
import ChatPage from './components/Chat/ChatPage';
import BillingPage from './components/Billing/BillingPage';
import StaffPage from './components/Staff/StaffPage';
import LoginDebug from './components/Auth/LoginDebug';

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

  if (!user) {
    return <AuthContainer />;
  }

  return (
    <AppProvider>
      <Router>
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
      </Router>
    </AppProvider>
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