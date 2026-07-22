import { useEffect } from 'react';
import config from '@config';

const setMeta = (selector, attributes) => {
  let node = document.head.querySelector(selector);
  if (!node) {
    node = document.createElement(attributes.name ? 'meta' : 'link');
    document.head.appendChild(node);
  }
  Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
};

export default function PageMetadata({ title, description = '', canonicalPath = window.location.pathname, noindex = false }) {
  useEffect(() => {
    const siteName = config.siteName || config.title || 'Blog';
    const fullTitle = title ? `${title} | ${siteName}` : siteName;
    const canonical = new URL(canonicalPath, window.location.origin).href;
    document.title = fullTitle;
    setMeta('meta[name="description"]', { name: 'description', content: description });
    setMeta('meta[property="og:title"]', { property: 'og:title', content: fullTitle });
    setMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    setMeta('meta[property="og:url"]', { property: 'og:url', content: canonical });
    setMeta('link[rel="canonical"]', { rel: 'canonical', href: canonical });
    setMeta('meta[name="robots"]', { name: 'robots', content: noindex ? 'noindex,nofollow' : 'index,follow' });
  }, [title, description, canonicalPath, noindex]);
  return null;
}
