import React from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';

registerSW({
  onNeedRefresh() {
    console.info('New content available; refresh the page to update.');
  },
  onOfflineReady() {
    console.info('App is ready to work offline.');
  },
});

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
