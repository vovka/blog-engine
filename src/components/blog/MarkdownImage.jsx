import ZoomableImage from './ZoomableImage';

const MERMAID_ASSET = /(?:^|\/)mermaid\/[a-f0-9]{64}\.svg$/;

export const isMermaidAssetUrl = source => MERMAID_ASSET.test(source);

function MarkdownImage({ src = '', className = '', ...props }) {
  const mermaidClass = isMermaidAssetUrl(src) ? 'mermaid-diagram' : '';
  const classes = [className, mermaidClass].filter(Boolean).join(' ');

  return <ZoomableImage src={src} className={classes || undefined} {...props} />;
}

export default MarkdownImage;
