import { memo, useMemo } from "react";
import DOMPurify from "dompurify";

interface ProseRendererProps {
  html: string;
  className?: string;
  style?: React.CSSProperties;
  /** BCP-47 language of the content (e.g. "sa" for Sanskrit) — exposed to assistive tech. */
  lang?: string;
}

const ALLOWED_TAGS = [
  "h1", "h2", "h3", "h4", "h5", "h6", "p", "br", "hr",
  "ul", "ol", "li", "blockquote", "pre", "code",
  "strong", "em", "b", "i", "u", "s", "sub", "sup",
  "a", "img", "span", "div", "table", "thead", "tbody",
  "tr", "th", "td", "figure", "figcaption", "mark",
];

const ALLOWED_ATTR = [
  "href", "src", "alt", "title", "width", "height",
  "class", "id", "target", "rel",
];

export const ProseRenderer = memo(function ProseRenderer({ html, className = "", style, lang }: ProseRendererProps) {
  const sanitized = useMemo(() => {
    if (!html) return "";
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      ALLOW_DATA_ATTR: false,
    });
  }, [html]);

  return (
    <div
      className={`prose prose-lg max-w-none prose-headings:font-serif prose-a:text-accent-gold prose-a:no-underline hover:prose-a:underline prose-blockquote:border-accent-gold prose-blockquote:bg-surface-container-low prose-blockquote:py-1 prose-blockquote:not-italic prose-img:rounded-xl prose-img:shadow-md ${className}`}
      style={style}
      lang={lang}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
});
