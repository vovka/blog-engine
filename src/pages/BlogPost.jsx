import { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { getPostBySlug } from '@content/posts';
import config from '@config';
import { markdownRemarkPlugins, markdownRehypePlugins, markdownComponents } from '../components/blog/markdownConfig';
import DialogueContent from '../components/blog/DialogueContent';
import GiscusComments from '../components/comments/GiscusComments';
import Layout from '../components/layout/Layout';

function BlogPost() {
  const { slug } = useParams();
  const post = getPostBySlug(slug);
  const [showOpponent, setShowOpponent] = useState(true);

  if (!post) {
    return <Navigate to="/404" replace />;
  }

  const isDialogue = post.layout === 'dialogue';
  const containerClassName = `blog-post-container${isDialogue && showOpponent ? ' blog-post-container--dialogue' : ''}`;

  return (
    <Layout>
      <div className={containerClassName}>
        <article className="blog-post">
          {post.coverImage && (
            <div className="blog-post-image">
              <img src={post.coverImage} alt={post.title} />
            </div>
          )}

          <div className="blog-post-header">
            {post.category && (
              <span className="category-badge">{post.category}</span>
            )}
            <h1 className="blog-post-title">{post.title}</h1>

            <div className="blog-post-meta">
              <div className="post-author">
                {post.authorAvatar ? (
                  <img src={post.authorAvatar} alt={post.author} className="author-avatar" />
                ) : (
                  <div className="author-avatar-placeholder">
                    {post.author?.charAt(0) || 'A'}
                  </div>
                )}
                <span className="author-name">{post.author}</span>
              </div>
              <div className="post-info">
                <span className="post-date">{post.date}</span>
                <span className="meta-separator">•</span>
                <span className="reading-time">{post.readingTime}</span>
              </div>
            </div>

            {isDialogue && (
              <button
                type="button"
                className="dialogue-toggle"
                aria-pressed={showOpponent}
                onClick={() => setShowOpponent(value => !value)}
              >
                {showOpponent ? 'Hide second opinion' : 'Show second opinion'}
              </button>
            )}
          </div>

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
