
import React from 'react';
import { Header } from './Header';
import { BottomNavigation } from './BottomNavigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <main className="pb-24">
        {children}
      </main>
      
    </div>
  );
};
