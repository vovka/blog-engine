function BlogPostHeader({ post, showOpponent, onToggle }) {
  const isDialogue = post.layout === 'dialogue';
  return <>
    {post.coverImage && (
      <div className="blog-post-image">
        <img src={post.coverImage} alt={post.title} />
      </div>
    )}
    <div className="blog-post-header">
      {post.category && <span className="category-badge">{post.category}</span>}
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
          onClick={onToggle}
        >
          {showOpponent ? 'Hide second opinion' : 'Show second opinion'}
        </button>
      )}
    </div>
  </>;
}

export default BlogPostHeader;
