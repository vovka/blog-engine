import { useRef, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { getPostBySlug } from '@content/posts';
import config from '@config';
import { markdownRemarkPlugins, markdownRehypePlugins, markdownComponents } from '../components/blog/markdownConfig';
import DialogueContent from '../components/blog/DialogueContent';
import GiscusComments from '../components/comments/GiscusComments';
import Layout from '../components/layout/Layout';
import ArticleAnalytics from '../components/analytics/ArticleAnalytics';
import PageMetadata from '../components/analytics/PageMetadata';
import { useAnalyticsConsent } from '../components/analytics/AnalyticsProvider';
import { trackEvent } from '../utils/analytics';
import BlogPostHeader from '../components/blog/BlogPostHeader';

function BlogPost() {
  const { slug } = useParams();
  const post = getPostBySlug(slug);
  const [showOpponent, setShowOpponent] = useState(true);
  const articleRef = useRef(null);
  const { active } = useAnalyticsConsent();

  if (!post) {
    return <Navigate to="/404" replace />;
  }

  const isDialogue = post.layout === 'dialogue';
  const containerClassName = `blog-post-container${isDialogue && showOpponent ? ' blog-post-container--dialogue' : ''}`;
  const toggleDialogue = () => {
    const nextValue = !showOpponent;
    setShowOpponent(nextValue);
    if (active) trackEvent('dialogue_toggle', {
      article_slug: post.slug,
      second_opinion: nextValue ? 'shown' : 'hidden',
    });
  };

  return (
    <Layout>
      <PageMetadata title={post.title} description={post.excerpt} canonicalPath={`/${post.slug}`} />
      <ArticleAnalytics active={active} articleRef={articleRef} post={post} />
      <div className={containerClassName}>
        <article ref={articleRef} className="blog-post">
          <BlogPostHeader post={post} showOpponent={showOpponent} onToggle={toggleDialogue} />

          <div className="blog-post-content">
            {isDialogue ? (
              <DialogueContent
                content={post.content}
                showOpponent={showOpponent}
              />
            ) : (
              <ReactMarkdown
                remarkPlugins={markdownRemarkPlugins}
                rehypePlugins={markdownRehypePlugins}
                components={markdownComponents}
              >
                {post.content}
              </ReactMarkdown>
            )}
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="blog-post-tags">
              {post.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          )}

          <GiscusComments
            enabled={post.commentsEnabled === true}
            commentId={post.commentId ?? post.slug}
            slug={post.slug}
            config={config.comments}
          />
        </article>
      </div>
    </Layout>
  );
}

export default BlogPost;
