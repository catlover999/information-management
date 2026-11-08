import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../App';

if (window.location.search.includes('fullscreen=1')) {
  document.body.classList.add('fullscreen-mode');
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <div className="phone-viewport">
      <App />
    </div>,
  );
}
