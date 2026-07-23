import React from 'react';
import ReactDOM from 'react-dom/client';
import config from '@config';
import App from './App';
import { normalizeAnalyticsConfig, setGoogleConsentDefault } from './utils/analytics';

setGoogleConsentDefault(normalizeAnalyticsConfig(config.analytics));

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
