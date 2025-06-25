
import { Header } from './Header';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-black w-full overflow-x-hidden">
      <Header />
      <div className="container mx-auto px-4 py-6 w-full max-w-full">
        <main className="flex-1 w-full">
          {children}
        </main>
      </div>
    </div>
  );
};
