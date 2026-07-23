import { useEffect } from 'react';
import config from '@config';
import { buildCanonicalUrl } from '../../utils/pageMetadata';
import { getRobotsConfig, resolveRobotsDirective } from '../../utils/robotsMetadata';

const setMeta = (selector, attributes) => {
  let node = document.head.querySelector(selector);
  if (!node) {
    node = document.createElement(selector.startsWith('link') ? 'link' : 'meta');
    document.head.appendChild(node);
  }
  Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
};

export default function PageMetadata({ title, description = '', canonicalPath = window.location.pathname, noindex = false }) {
  useEffect(() => {
    const siteName = config.siteName || config.title || 'Blog';
    const fullTitle = title ? `${title} | ${siteName}` : siteName;
    const canonical = buildCanonicalUrl(canonicalPath, config, window.location.origin);
    const robots = resolveRobotsDirective({ ...getRobotsConfig(config), routeNoindex: noindex });
    document.title = fullTitle;
    setMeta('meta[name="description"]', { name: 'description', content: description });
    setMeta('meta[property="og:title"]', { property: 'og:title', content: fullTitle });
    setMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    setMeta('meta[property="og:url"]', { property: 'og:url', content: canonical });
    setMeta('link[rel="canonical"]', { rel: 'canonical', href: canonical });
    setMeta('meta[name="robots"]', { name: 'robots', content: robots });
  }, [title, description, canonicalPath, noindex]);
  return null;
}
