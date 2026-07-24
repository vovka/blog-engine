const MERMAID_ASSET = /(?:^|\/)mermaid\/[a-f0-9]{64}\.svg$/;

export const isMermaidAssetUrl = source => MERMAID_ASSET.test(source);

function MarkdownImage({ src = '', className = '', node, ...props }) {
  if (!isMermaidAssetUrl(src)) {
    return <img src={src} className={className || undefined} {...props} />;
  }
  const classes = [className, 'mermaid-diagram'].filter(Boolean).join(' ');

  return <img src={src} className={classes} {...props} />;
}

export default MarkdownImage;
