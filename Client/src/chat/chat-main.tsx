import { createRoot } from 'react-dom/client';
import ChatApp from './ChatApp';
import './chat.css';

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/chat-sw.js').catch((err) => {
      console.warn('SW registration failed:', err);
    });
  });
}

createRoot(document.getElementById('chat-root')!).render(<ChatApp />);
