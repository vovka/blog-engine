import { Children } from 'react';
import MarkdownImageLinkContext from './MarkdownImageLinkContext';

const GITHUB_ATTACHMENT_VIDEO_PATTERN = /^https:\/\/github\.com\/user-attachments\/assets\/[0-9a-f-]{36}(?:[?#].*)?$/i;
const DIRECT_VIDEO_PATTERN = /^(?:https?:\/\/|\/).+\.(mp4|webm|mov|m4v)(?:[?#].*)?$/i;

export function getTextContent(children) {
  return Children.toArray(children)
    .filter(child => typeof child === 'string' || typeof child === 'number')
    .join('');
}

export function isVideoUrl(url) {
  return GITHUB_ATTACHMENT_VIDEO_PATTERN.test(url) || DIRECT_VIDEO_PATTERN.test(url);
}

export function VideoEmbed({ href }) {
  return (
    <video src={href} controls preload="metadata" playsInline className="blog-post-video">
      <a href={href}>Open video</a>
    </video>
  );
}

function MarkdownVideoLink({ href = '', children, node, ...props }) {
  const linkText = getTextContent(children);
  const presentsUrl = linkText.trim() === href.trim();

  if (presentsUrl && isVideoUrl(href)) {
    return <VideoEmbed href={href} />;
  }

  return (
    <a href={href} {...props}>
      <MarkdownImageLinkContext value>
        {children}
      </MarkdownImageLinkContext>
    </a>
  );
}

export default MarkdownVideoLink;
