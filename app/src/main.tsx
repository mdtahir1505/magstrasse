import { createRoot } from 'react-dom/client';
import App from './App';
import './strasse.css';
import './screens.css';

createRoot(document.getElementById('root')!).render(<App />);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('./sw.js').catch(() => { /* offline shell is optional */ });
}
