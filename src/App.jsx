import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GitHubPagesRedirect } from './utils/githubPagesRedirect';
import { ScrollToTop } from './utils/scrollToTop';
import { pages } from '@content/metadata';
import AnalyticsProvider from './components/analytics/AnalyticsProvider';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import StaticPage from './pages/StaticPage';
import NotFound from './pages/NotFound';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <GitHubPagesRedirect />
      <AnalyticsProvider />
      <Routes>
        <Route path="/" element={<Blog />} />
        {pages.map(page => (
          <Route key={page.slug} path={`/${page.slug}`} element={<StaticPage />} />
        ))}
        <Route path="/:slug" element={<BlogPost />} />
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
