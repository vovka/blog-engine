import { useLayoutEffect, useState } from 'react';
import Giscus from '@giscus/react';
import './GiscusComments.css';

export interface GiscusConfiguration {
  repo: `${string}/${string}`;
  repoId: string;
  category: string;
  categoryId: string;
  canonicalBaseUrl: string;
}

export interface GiscusCommentsProps {
  enabled: boolean;
  commentId: string;
  slug: string;
  config: GiscusConfiguration;
}

const GISCUS_BACKLINK_SELECTOR = 'meta[name="giscus:backlink"]';

export function GiscusComments({
  enabled,
  commentId,
  slug,
  config,
}: GiscusCommentsProps) {
  const [backlinkReady, setBacklinkReady] = useState(false);
  const configured = Boolean(config?.repoId && config?.categoryId);

  useLayoutEffect(() => {
    if (!enabled || !configured) {
      return undefined;
    }

    const existingMeta = document.head.querySelector<HTMLMetaElement>(
      GISCUS_BACKLINK_SELECTOR,
    );
    const previousContent = existingMeta?.getAttribute('content') ?? null;
    const backlinkMeta = existingMeta ?? document.createElement('meta');

    if (!existingMeta) {
      backlinkMeta.name = 'giscus:backlink';
      document.head.appendChild(backlinkMeta);
    }

    const canonicalBaseUrl = config.canonicalBaseUrl.replace(/\/+$/, '');
    const canonicalSlug = slug.replace(/^\/+/, '');
    backlinkMeta.content = `${canonicalBaseUrl}/${canonicalSlug}`;
    setBacklinkReady(true);

    return () => {
      if (existingMeta) {
        if (previousContent === null) {
          existingMeta.removeAttribute('content');
        } else {
          existingMeta.setAttribute('content', previousContent);
        }
      } else {
        backlinkMeta.remove();
      }
    };
  }, [configured, config?.canonicalBaseUrl, enabled, slug]);

  if (!enabled || !configured) {
    return null;
  }

  const headingId = `comments-heading-${commentId}`;

  return (
    <section className="blog-comments" aria-labelledby={headingId}>
      <h2 id={headingId}>Comments</h2>
      <p className="blog-comments__notice">
        Comments are powered by GitHub Discussions. A GitHub account is required
        to participate.
      </p>

      {backlinkReady && (
        <Giscus
          key={commentId}
          id={`comments-${commentId}`}
          repo={config.repo}
          repoId={config.repoId}
          category={config.category}
          categoryId={config.categoryId}
          mapping="specific"
          term={`article:${commentId}`}
          strict="1"
          reactionsEnabled="1"
          emitMetadata="0"
          inputPosition="top"
          theme="light"
          lang="en"
          loading="lazy"
        />
      )}
    </section>
  );
}

export default GiscusComments;
