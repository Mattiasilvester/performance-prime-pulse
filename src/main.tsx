import { createRoot } from 'react-dom/client'
import './index.css'

// Import condizionale basato su modalità
const App = import.meta.env.VITE_APP_MODE === 'landing' 
  ? require('./landing/App').default 
  : require('./App').default;

createRoot(document.getElementById("root")!).render(<App />);
