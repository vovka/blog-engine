const MERMAID_ASSET = /(?:^|\/)mermaid\/[a-f0-9]{64}\.svg$/;

export const isMermaidAssetUrl = source => MERMAID_ASSET.test(source);

export const mermaidScrollLabel = alt => (
  alt ? `Scrollable diagram: ${alt}` : 'Scrollable diagram'
);

function MarkdownImage({ src = '', className = '', node, ...props }) {
  if (!isMermaidAssetUrl(src)) {
    return <img src={src} className={className || undefined} {...props} />;
  }
  const classes = [className, 'mermaid-diagram'].filter(Boolean).join(' ');

  return (
    <span
      className="mermaid-diagram-scroll"
      role="region"
      tabIndex={0}
      aria-label={mermaidScrollLabel(props.alt)}
    >
      <img src={src} className={classes} {...props} />
    </span>
  );
}

export default MarkdownImage;
