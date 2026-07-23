import { useState } from 'react';
import { posts } from '@content/posts';
import Layout from '../components/layout/Layout';
import SearchBar from '../components/common/SearchBar';
import BlogGrid from '../components/blog/BlogGrid';
import PageMetadata from '../components/analytics/PageMetadata';
import config from '@config';

function Blog() {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter posts based on search query
  const filteredPosts = posts.filter(post => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      post.title.toLowerCase().includes(query) ||
      post.excerpt?.toLowerCase().includes(query) ||
      post.category?.toLowerCase().includes(query) ||
      post.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  });

  if (posts.length === 0) {
    return (
      <Layout>
        <PageMetadata title="Blog" description={config.description} canonicalPath="/" />
        <div className="no-posts-container">
          <p className="no-posts">No posts yet. Run <code>npx blog-engine process</code> to generate posts.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageMetadata title="Blog" description={config.description} canonicalPath="/" />
      <div className="search-section">
        <h2 className="page-title">Blog</h2>
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      <div className="container">
        <BlogGrid posts={filteredPosts} />
      </div>
    </Layout>
  );
}

export default Blog;
