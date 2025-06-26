
import { Header } from './Header';
import { Navigation } from './Navigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div className="flex gap-6 container mx-auto px-4 py-6 max-w-full">
        <Navigation />
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
      {/* Mobile navigation is rendered globally through the Navigation component */}
    </div>
  );
};
