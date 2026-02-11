import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  return (
    <div
      className={`prose dark:prose-invert prose-sm max-w-none
        prose-headings:text-foreground prose-headings:font-bold
        prose-p:text-muted-foreground prose-p:leading-relaxed
        prose-a:text-neon dark:prose-a:text-neon prose-a:no-underline hover:prose-a:underline
        prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5
        prose-code:text-sm prose-code:font-mono prose-code:text-foreground
        prose-code:border prose-code:border-border
        prose-pre:bg-muted prose-pre:border-2 prose-pre:border-border
        prose-blockquote:border-primary prose-blockquote:text-muted-foreground
        prose-strong:text-foreground
        prose-ul:text-muted-foreground prose-ol:text-muted-foreground
        prose-li:marker:text-primary
        prose-table:text-muted-foreground
        prose-th:text-foreground prose-th:border-border
        prose-td:border-border
        prose-hr:border-border
        ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize, rehypeHighlight]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownRenderer;
