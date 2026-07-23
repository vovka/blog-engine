export const SCROLL_MILESTONES = [25, 50, 75, 90];

export const getReachedMilestones = (percent, tracked) => (
  SCROLL_MILESTONES.filter(milestone => percent >= milestone && !tracked.has(milestone))
);

export const getArticleScrollPercent = article => {
  const start = article.getBoundingClientRect().top + window.scrollY;
  const progress = window.scrollY + window.innerHeight - start;
  return Math.max(0, Math.min(100, Math.round((progress / article.offsetHeight) * 100)));
};

export const getOutboundUrl = (target, origin) => {
  const link = target.closest?.('a[href]');
  if (!link) return null;
  try {
    const url = new URL(link.href, origin);
    if (!['http:', 'https:'].includes(url.protocol) || url.origin === origin) return null;
    return url;
  } catch {
    return null;
  }
};

export const sanitizeOutboundUrl = url => `${url.origin}${url.pathname}`;
