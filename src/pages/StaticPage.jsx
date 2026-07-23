import { useLocation, Navigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { getPageBySlug } from '@content/pages';
import Layout from '../components/layout/Layout';
import PageMetadata from '../components/analytics/PageMetadata';

function StaticPage() {
  const location = useLocation();
  // Extract slug from pathname (e.g., "/about" -> "about")
  const slug = location.pathname.slice(1);
  const page = getPageBySlug(slug);

  if (!page) {
    return <Navigate to="/404" replace />;
  }

  return (
    <Layout>
      <PageMetadata title={page.title} description={page.description} canonicalPath={`/${page.slug}`} />
      <div className="static-page-container">
        <div className="static-page-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          >
            {page.content}
          </ReactMarkdown>
        </div>
      </div>
    </Layout>
  );
}

export default StaticPage;
