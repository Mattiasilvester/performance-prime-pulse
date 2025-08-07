
import React from 'react';
import { Header } from './Header';
import { BottomNavigation } from './BottomNavigation';
import { FloatingActionButton } from './FloatingActionButton';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <main className="pb-20 lg:pb-6">
        {children}
      </main>
      
      {/* Bottom Navigation */}
      <BottomNavigation />
      
      {/* Floating Action Button */}
      <FloatingActionButton />
    </div>
  );
};
