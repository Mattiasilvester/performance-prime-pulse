
import React from 'react';
import { Header } from './Header';
import { Navigation } from './Navigation';

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
      
      {/* Navigation Footer */}
      <Navigation />
    </div>
  );
};
