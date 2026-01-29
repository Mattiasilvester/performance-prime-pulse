import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-[#212121] py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-8">
          {/* Performance Prime Column */}
          <div>
            <h3 className="text-xl font-bold text-[#FFD700] mb-3">
              Performance Prime
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Oltre ogni limite, verso la tua versione migliore.
            </p>
          </div>

          {/* Link Utili Column */}
          <div>
            <h3 className="text-xl font-bold text-[#FFD700] mb-3">
              Link Utili
            </h3>
            <div className="space-y-2">
              <Link
                to="/auth/login"
                className="block text-gray-300 hover:text-[#FFD700] transition-colors underline text-sm"
              >
                Accedi
              </Link>
              <Link
                to="/partner/terms"
                className="block text-gray-300 hover:text-[#FFD700] transition-colors underline text-sm"
              >
                Termini e Condizioni
              </Link>
              <Link
                to="/partner/privacy"
                className="block text-gray-300 hover:text-[#FFD700] transition-colors underline text-sm"
              >
                Privacy Policy
              </Link>
              <Link
                to="/partner/cookies"
                className="block text-gray-300 hover:text-[#FFD700] transition-colors underline text-sm"
              >
                Cookie Policy
              </Link>
            </div>
          </div>

          {/* Contatti Column */}
          <div>
            <h3 className="text-xl font-bold text-[#FFD700] mb-3">
              Contatti
            </h3>
            <div className="space-y-2 text-gray-300 text-sm">
              <p>Email: primeassistenza@gmail.com</p>
              <p>P.IVA: 17774791002</p>
            </div>
          </div>
        </div>

        {/* Separator Line */}
        <div className="border-t border-[#FFD700] mb-6"></div>

        {/* Copyright Notice */}
        <div className="text-center">
          <p className="text-gray-300 text-sm">
            © 2025 Performance Prime. Tutti i diritti riservati.
          </p>
        </div>
      </div>
    </footer>
  );
}

