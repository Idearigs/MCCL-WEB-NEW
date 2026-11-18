import { createRoot } from 'react-dom/client'

// After a deploy, a page opened earlier can request an old (now deleted) code chunk. Reload once
// to fetch the new build rather than leaving the visitor on a blank or broken page.
window.addEventListener('vite:preloadError', (event) => {
  const key = 'mccl-chunk-reload';
  if (sessionStorage.getItem(key)) return; // already tried: let the error surface
  sessionStorage.setItem(key, String(Date.now()));
  event.preventDefault();
  window.location.reload();
});
window.addEventListener('load', () => setTimeout(() => sessionStorage.removeItem('mccl-chunk-reload'), 10000));
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);
