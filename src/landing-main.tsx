import { createRoot } from 'react-dom/client'
import LandingApp from './landing/App'
import './index.css'

console.log('🚀 Loading Landing App...');

createRoot(document.getElementById("root")!).render(<LandingApp />); 