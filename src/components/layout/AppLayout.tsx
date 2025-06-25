
import { Header } from './Header';
import { Navigation } from './Navigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-black w-full overflow-x-hidden">
      <Header />
      <div className="flex gap-6 container mx-auto px-4 py-6 w-full max-w-full">
        <Navigation />
        <main className="flex-1 w-full">
          {children}
        </main>
      </div>
      {/* Mobile navigation is rendered globally through the Navigation component */}
    </div>
  );
};
