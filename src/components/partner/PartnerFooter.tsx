import { Link } from 'react-router-dom';

export function PartnerFooter() {
  return (
    <footer className="partner-footer py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-8">
          {/* Performance Prime Column */}
          <div>
            <h3 className="partner-accent-text text-xl font-bold mb-3">
              Performance Prime
            </h3>
            <p className="partner-muted-text text-sm leading-relaxed">
              La piattaforma per professionisti fitness e wellness.
            </p>
          </div>

          {/* Link Utili Column */}
          <div>
            <h3 className="partner-accent-text text-xl font-bold mb-3">
              Link Utili
            </h3>
            <div className="space-y-2">
              <Link
                to="/partner/login"
                className="partner-footer-link block transition-colors underline text-sm"
              >
                Accedi
              </Link>
              <Link
                to="/terms-and-conditions"
                className="partner-footer-link block transition-colors underline text-sm"
              >
                Termini e Condizioni
              </Link>
              <Link
                to="/privacy-policy"
                className="partner-footer-link block transition-colors underline text-sm"
              >
                Privacy Policy
              </Link>
            </div>
          </div>

          {/* Contatti Column */}
          <div>
            <h3 className="partner-accent-text text-xl font-bold mb-3">
              Contatti
            </h3>
            <div className="space-y-2 partner-muted-text text-sm">
              <p>Email: primeassistenza@gmail.com</p>
              <p>P.IVA: 17774791002</p>
            </div>
          </div>
        </div>

        {/* Separator Line */}
        <div className="partner-divider border-t mb-6"></div>

        {/* Copyright Notice */}
        <div className="text-center">
          <p className="partner-muted-text text-sm">
            © 2025 Performance Prime. Tutti i diritti riservati.
          </p>
        </div>
      </div>
    </footer>
  );
}

