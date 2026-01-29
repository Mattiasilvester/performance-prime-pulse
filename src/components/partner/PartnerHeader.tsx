import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function PartnerHeader() {
  return (
    <header className="partner-header fixed top-0 left-0 right-0 backdrop-blur-xl shadow-lg z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/partner" className="flex items-center space-x-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <img 
                src="/images/logo-pp-transparent.png" 
                alt="Prime Pro Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <h1 className="partner-accent-text text-sm lg:text-xl font-bold leading-tight">
              <span style={{ color: 'var(--partner-primary-foreground)' }}>Prime </span>
              <span style={{ color: '#EEBA2B' }}>Pro</span>
            </h1>
              <p className="text-xs partner-muted-text leading-tight" style={{ color: 'var(--partner-primary-foreground)' }}>Per Professionisti</p>
            </div>
          </Link>

          {/* CTA */}
          <Link to="/partner/registrazione">
            <Button className="partner-btn-primary font-semibold px-6 py-2 rounded-full">
              Inizia la prova gratuita
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

