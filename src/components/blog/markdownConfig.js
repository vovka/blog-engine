import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import MarkdownImage from './MarkdownImage';
import MarkdownVideoLink from './MarkdownVideoLink';
import MarkdownVideoParagraph from './MarkdownVideoParagraph';

export const markdownRemarkPlugins = [remarkGfm];
export const markdownRehypePlugins = [rehypeHighlight];
export const markdownComponents = {
  a: MarkdownVideoLink,
  img: MarkdownImage,
  p: MarkdownVideoParagraph,
};
