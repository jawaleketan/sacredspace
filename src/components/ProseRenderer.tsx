import { memo } from "react";

interface ProseRendererProps {
  html: string;
  className?: string;
  style?: React.CSSProperties;
}

export const ProseRenderer = memo(function ProseRenderer({ html, className = "", style }: ProseRendererProps) {
  return (
    <div
      className={`prose prose-lg max-w-none prose-headings:font-serif prose-a:text-accent-gold prose-a:no-underline hover:prose-a:underline prose-blockquote:border-accent-gold prose-blockquote:bg-surface-container-low prose-blockquote:py-1 prose-blockquote:not-italic prose-img:rounded-xl prose-img:shadow-md ${className}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});
