import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/ui/Logo';
import { Footer } from '@/components/layout/Footer';

interface ClientDashboardLayoutProps {
  children: React.ReactNode;
}

export function ClientDashboardLayout({ children }: ClientDashboardLayoutProps) {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100"> {/* Soft gradient background */}
      <header className="border-b border-gray-200 bg-white shadow-lg sticky top-0 z-50"> {/* Enhanced shadow for depth */}
        <div className="container mx-auto px-6 py-5 flex items-center justify-between"> {/* Increased padding */}
          <div className="flex items-center space-x-4">
            <Logo size="sm" />
            <h1 className="text-2xl font-bold text-gray-900">Client Portal</h1> {/* Larger, bolder title */}
          </div>
          <Button variant="outline" onClick={signOut} className="px-4 py-2 text-base rounded-lg border-gray-300 hover:bg-gray-50 transition-colors duration-200"> {/* More refined button */}
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-6 py-10"> {/* Generous vertical padding */}
        {children}
      </main>
      <Footer />
    </div>
  );
}