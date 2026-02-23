
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

// Polyfill para evitar crash em ambientes onde process.env não é injetado globalmente
if (typeof window !== 'undefined') {
  (window as any).process = (window as any).process || { env: {} };
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
