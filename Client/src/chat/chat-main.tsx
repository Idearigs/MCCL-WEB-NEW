import { createRoot } from 'react-dom/client';
import ChatApp from './ChatApp';
import './chat.css';

// Handle mobile virtual keyboard - keep app sized to visible viewport
function updateAppHeight() {
  const vh = window.visualViewport?.height || window.innerHeight;
  document.documentElement.style.setProperty('--app-height', `${vh}px`);
}

updateAppHeight();

if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', updateAppHeight);
  window.visualViewport.addEventListener('scroll', () => {
    // Prevent page from scrolling up when keyboard opens
    if (window.visualViewport) {
      window.scrollTo(0, 0);
    }
    updateAppHeight();
  });
} else {
  window.addEventListener('resize', updateAppHeight);
}

// Prevent pull-to-refresh and overscroll in standalone mode
document.addEventListener('touchmove', (e) => {
  if (document.body.scrollHeight <= window.innerHeight) {
    // Only prevent if not inside a scrollable area
    const target = e.target as HTMLElement;
    if (!target.closest('.messages-scroll') && !target.closest('.chat-list-scroll')) {
      e.preventDefault();
    }
  }
}, { passive: false });

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/chat-sw.js').catch((err) => {
      console.warn('SW registration failed:', err);
    });
  });
}

createRoot(document.getElementById('chat-root')!).render(<ChatApp />);
