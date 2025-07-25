import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-pp-gold to-yellow-500 rounded-xl flex items-center justify-center mx-auto mb-8">
          <span className="text-black font-bold text-4xl">404</span>
        </div>
        <h1 className="text-4xl font-bold mb-4 text-pp-gold">Pagina non trovata</h1>
        <p className="text-xl text-pp-gold/80 mb-8">La pagina che stai cercando non esiste.</p>
        <Button 
          onClick={handleReload}
          className="bg-pp-gold text-black hover:bg-pp-gold/90 font-semibold px-8 py-3 text-lg"
        >
          Ricarica Pagina
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
