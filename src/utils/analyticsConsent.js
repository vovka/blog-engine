const COOKIE_NAMES = [/^_ga/, /^_gid$/, /^_gat/];

export const getCookieDomains = hostname => {
  const labels = hostname.split('.').filter(Boolean);
  if (labels.length < 2) return [];
  return labels.slice(0, -1).map((_, index) => `.${labels.slice(index).join('.')}`);
};

export const hasGlobalPrivacyControl = () => (
  typeof navigator !== 'undefined' && navigator.globalPrivacyControl === true
);

export const readConsent = config => {
  if (typeof window === 'undefined') return 'unknown';
  if (hasGlobalPrivacyControl()) return 'rejected';
  try {
    const stored = JSON.parse(localStorage.getItem(config.consent.storageKey));
    if (stored?.policyVersion !== config.consent.policyVersion) return 'unknown';
    if (stored?.analytics === 'accepted') return 'accepted';
    return stored?.analytics === 'rejected' ? 'rejected' : 'unknown';
  } catch {
    return 'unknown';
  }
};

export const getInitialConsent = config => {
  if (hasGlobalPrivacyControl()) return 'rejected';
  return config.consent.required ? readConsent(config) : 'accepted';
};

export const resolveConsentUpdate = analytics => (
  hasGlobalPrivacyControl() ? 'rejected' : analytics
);

export const saveConsent = (config, analytics) => {
  try {
    localStorage.setItem(config.consent.storageKey, JSON.stringify({
      analytics,
      policyVersion: config.consent.policyVersion,
      updatedAt: new Date().toISOString(),
    }));
    return true;
  } catch {
    return false;
  }
};

export const clearAnalyticsCookies = () => {
  const domains = getCookieDomains(location.hostname);
  document.cookie.split(';').forEach(cookie => {
    const name = cookie.split('=')[0].trim();
    if (!COOKIE_NAMES.some(pattern => pattern.test(name))) return;
    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
    domains.forEach(domain => {
      document.cookie = `${name}=; Max-Age=0; path=/; domain=${domain}; SameSite=Lax`;
    });
  });
};
