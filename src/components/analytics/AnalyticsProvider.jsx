import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import config from '@config';
import { clearAnalyticsCookies, initializeAnalytics, normalizeAnalyticsConfig, readConsent, saveConsent, trackPageView } from '../../utils/analytics';
import './Analytics.css';

const AnalyticsContext = createContext(null);
export const useAnalyticsConsent = () => useContext(AnalyticsContext);

function RouteTracker({ active }) {
  const location = useLocation();
  const previous = useRef('');
  useEffect(() => {
    if (!active) return;
    const path = `${location.pathname}${location.search}`;
    if (previous.current === path) return;
    previous.current = path;
    queueMicrotask(() => trackPageView({ title: document.title, path, location: window.location.href }));
  }, [active, location.pathname, location.search]);
  return null;
}

function ConsentBanner({ analyticsConfig, onAccept, onReject }) {
  return <section className="analytics-consent" role="dialog" aria-label="Analytics preferences">
    <p>We use optional analytics to understand traffic and improve the blog. Nothing is loaded until you choose.</p>
    <div className="analytics-consent__actions">
      <button type="button" onClick={onAccept}>Accept analytics</button>
      <button type="button" onClick={onReject}>Reject non-essential analytics</button>
      <a href={analyticsConfig.consent.privacyPagePath}>Privacy</a>
    </div>
  </section>;
}

export default function AnalyticsProvider() {
  const analyticsConfig = useMemo(() => normalizeAnalyticsConfig(config.analytics), []);
  const [consent, setConsent] = useState(() => readConsent(analyticsConfig));
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (consent !== 'accepted') return;
    initializeAnalytics(analyticsConfig).then(() => setInitialized(true)).catch(console.error);
  }, [analyticsConfig, consent]);
  const updateConsent = value => {
    saveConsent(analyticsConfig, value);
    setConsent(value);
    if (value === 'rejected') {
      window.clarity?.('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' });
      clearAnalyticsCookies();
      setInitialized(false);
    }
  };
  useEffect(() => {
    window.blogAnalyticsPreferences = () => setConsent('unknown');
    return () => { delete window.blogAnalyticsPreferences; };
  }, []);
  return <AnalyticsContext.Provider value={{ consent, setConsent: updateConsent, active: initialized }}>
    <RouteTracker active={initialized} />
    {analyticsConfig.enabled && analyticsConfig.consent.required && consent === 'unknown' && <ConsentBanner analyticsConfig={analyticsConfig} onAccept={() => updateConsent('accepted')} onReject={() => updateConsent('rejected')} />}
  </AnalyticsContext.Provider>;
}
