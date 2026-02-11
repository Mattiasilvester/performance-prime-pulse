import React from 'react';
import ReactDOM from 'react-dom/client';
import { inject } from '@vercel/analytics';
import './index.css';
import App from './App';

inject();

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

const root = ReactDOM.createRoot(rootEl);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
