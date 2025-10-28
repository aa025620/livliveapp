import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available, refresh the page
                window.location.reload();
              }
            });
          }
        });
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Track app launch from app stores
window.addEventListener('DOMContentLoaded', () => {
  // Detect if running as installed app (from app store)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                       (window.navigator as any).standalone === true;
  
  if (isStandalone) {
    console.log('FOMO Events launched as installed app from app store');
    // Add app store specific optimizations here if needed
    document.body.classList.add('standalone-app');
  }
});

// Track when app is launched from home screen
window.addEventListener('appinstalled', (evt) => {
  console.log('FOMO Events was installed successfully');
});

createRoot(document.getElementById("root")!).render(<App />);
