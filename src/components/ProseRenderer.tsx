interface ProseRendererProps {
  html: string;
  className?: string;
  proseClass?: string;
  style?: React.CSSProperties;
}

export function ProseRenderer({ html, className = "", proseClass = "", style }: ProseRendererProps) {
  return (
    <div
      className={`prose prose-lg max-w-none prose-headings:font-serif prose-a:text-accent-gold prose-a:no-underline hover:prose-a:underline prose-blockquote:border-accent-gold prose-blockquote:bg-surface-container-low prose-blockquote:py-1 prose-blockquote:not-italic prose-img:rounded-xl prose-img:shadow-md ${proseClass} ${className}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
