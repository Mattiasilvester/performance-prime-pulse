
import { Header } from './Header';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};
