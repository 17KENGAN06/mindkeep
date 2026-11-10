import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '@/App';
import { i18nReady } from '@/i18n';
import '@/index.css';

// Render once the visitor's language is loaded (a small chunk), so no text flashes in English.
void i18nReady.finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
