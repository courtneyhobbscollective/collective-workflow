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
    <div className="min-h-screen flex flex-col bg-gray-50"> {/* Lighter background */}
      <header className="border-b bg-white shadow-sm sticky top-0 z-50"> {/* Solid white header with shadow */}
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Logo size="sm" />
            <h1 className="text-xl font-semibold text-gray-800">Client Portal</h1> {/* Darker text for contrast */}
          </div>
          <Button variant="outline" onClick={signOut} className="hover:bg-gray-100"> {/* Subtle hover effect */}
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8"> {/* Increased vertical padding */}
        {children}
      </main>
      <Footer />
    </div>
  );
}