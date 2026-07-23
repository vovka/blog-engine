import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import config from '@config';
import {
  clearAnalyticsCookies,
  getInitialConsent,
  hasGlobalPrivacyControl,
  initializeAnalytics,
  normalizeAnalyticsConfig,
  resolveConsentUpdate,
  saveConsent,
  trackPageView,
  updateClarityConsent,
  updateGoogleConsent,
} from '../../utils/analytics';
import ConsentBanner from './ConsentBanner';
import './Analytics.css';

const AnalyticsContext = createContext({ consent: 'unknown', active: false });
export const useAnalyticsConsent = () => useContext(AnalyticsContext);

function RouteTracker({ active }) {
  const location = useLocation();
  const previous = useRef('');
  useEffect(() => {
    if (!active) {
      previous.current = '';
      return;
    }
    const path = `${location.pathname}${location.search}`;
    if (previous.current === path) return;
    previous.current = path;
    queueMicrotask(() => trackPageView({
      title: document.title,
      path,
      location: window.location.href,
    }));
  }, [active, location.pathname, location.search]);
  return null;
}

const suspendAnalytics = analyticsConfig => {
  if (!analyticsConfig.enabled) return;
  updateGoogleConsent(analyticsConfig, false);
  updateClarityConsent(false);
  clearAnalyticsCookies();
};

export default function AnalyticsProvider({ children }) {
  const analyticsConfig = useMemo(() => normalizeAnalyticsConfig(config.analytics), []);
  const gpc = useMemo(hasGlobalPrivacyControl, []);
  const [consent, setConsent] = useState(() => getInitialConsent(analyticsConfig));
  const [services, setServices] = useState({ ga4: false, clarity: false });
  const active = services.ga4 || services.clarity;

  useEffect(() => {
    if (consent !== 'accepted') {
      suspendAnalytics(analyticsConfig);
      setServices({ ga4: false, clarity: false });
      return undefined;
    }
    let current = true;
    initializeAnalytics(analyticsConfig).then(result => {
      if (current) setServices(result);
    }).catch(console.error);
    return () => { current = false; };
  }, [analyticsConfig, consent]);

  const updateConsent = value => {
    const resolved = resolveConsentUpdate(value);
    saveConsent(analyticsConfig, resolved);
    if (resolved !== 'accepted') suspendAnalytics(analyticsConfig);
    setConsent(resolved);
  };

  useEffect(() => {
    if (!gpc) window.blogAnalyticsPreferences = () => updateConsent('unknown');
    return () => { delete window.blogAnalyticsPreferences; };
  }, [gpc]);

  return <AnalyticsContext.Provider value={{ consent, active, services, setConsent: updateConsent }}>
    <RouteTracker active={active} />
    {children}
    {analyticsConfig.enabled && !gpc && consent !== 'unknown' && (
      <button className="analytics-preferences" type="button" onClick={() => updateConsent('unknown')}>
        Analytics preferences
      </button>
    )}
    {analyticsConfig.enabled && !gpc && consent === 'unknown' && (
      <ConsentBanner
        analyticsConfig={analyticsConfig}
        onAccept={() => updateConsent('accepted')}
        onReject={() => updateConsent('rejected')}
      />
    )}
  </AnalyticsContext.Provider>;
}
