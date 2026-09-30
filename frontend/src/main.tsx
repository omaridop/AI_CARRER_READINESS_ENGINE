import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { WizardProvider } from './context/WizardContext.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WizardProvider>
      <App />
    </WizardProvider>
  </React.StrictMode>,
)
