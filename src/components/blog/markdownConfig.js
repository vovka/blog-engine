import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import MarkdownVideoLink from './MarkdownVideoLink';
import MarkdownVideoParagraph from './MarkdownVideoParagraph';
import ZoomableImage from './ZoomableImage';

export const markdownRemarkPlugins = [remarkGfm];
export const markdownRehypePlugins = [rehypeHighlight];
export const markdownComponents = {
  a: MarkdownVideoLink,
  p: MarkdownVideoParagraph,
  img: ZoomableImage,
};
