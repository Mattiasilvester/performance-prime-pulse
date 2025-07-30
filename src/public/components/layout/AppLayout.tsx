
import { Header } from './Header';
import { Navigation } from './Navigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-black w-full">
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-full pt-20 lg:pl-72">
        <main className="w-full">
          {children}
        </main>
      </div>
      <Navigation />
    </div>
  );
};
