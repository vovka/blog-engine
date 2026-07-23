import { useEffect } from 'react';
import {
  getArticleScrollPercent,
  getOutboundUrl,
  getReachedMilestones,
  sanitizeOutboundUrl,
} from '../../utils/articleEvents';
import { setClarityTags, trackEvent } from '../../utils/analytics';

const articleParameters = post => ({
  article_slug: post.slug,
  article_title: post.title,
  reading_time: post.readingTime,
});

export default function ArticleAnalytics({ active, articleRef, post }) {
  useEffect(() => {
    const article = articleRef.current;
    if (!active || !article || !post) return undefined;
    const tracked = new Set();
    let read = false;
    const parameters = articleParameters(post);
    setClarityTags({ article_slug: post.slug, article_category: post.category });

    const onScroll = () => {
      const percent = getArticleScrollPercent(article);
      getReachedMilestones(percent, tracked).forEach(milestone => {
        tracked.add(milestone);
        trackEvent('article_scroll', { ...parameters, percent_scrolled: milestone });
      });
      if (percent >= 90 && !read) {
        read = true;
        trackEvent('article_read', parameters);
      }
    };

    const onClick = event => {
      const url = getOutboundUrl(event.target, window.location.origin);
      if (!url) return;
      trackEvent('outbound_click', {
        ...parameters,
        link_url: sanitizeOutboundUrl(url),
        link_domain: url.hostname,
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    article.addEventListener('click', onClick);
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      article.removeEventListener('click', onClick);
    };
  }, [active, articleRef, post]);
  return null;
}
