import { useHighlightedCode } from "@/hooks/use-highlighted-code"
import {
  CodeBlock,
  CodeBlockContent,
  CodeBlockHeader,
  CodeBlockTitle,
} from "@/components/ui/code-block"

type RawContentProps = {
  content: string
}

function formatJsonContent(content: string): string {
  try {
    const parsed: unknown = JSON.parse(content)
    if (typeof parsed === "object" && parsed !== null) {
      return JSON.stringify(parsed, null, 2)
    }
  } catch {
    // Keep non-JSON file content unchanged.
  }

  return content
}

export default function RawContent({ content }: RawContentProps) {
  const formattedContent = formatJsonContent(content)
  const highlightedLines = useHighlightedCode(formattedContent, "json")

  return (
    <CodeBlock size="sm" aria-label="Raw content">
      <CodeBlockHeader>
        <CodeBlockTitle>Raw content</CodeBlockTitle>
      </CodeBlockHeader>
      <CodeBlockContent
        wrap
        className="text-[11px] leading-tight"
        style={{
          scrollbarColor: "var(--muted-foreground) var(--background)",
        }}
      >
        {highlightedLines.map((line, index) => (
          <span className="block whitespace-pre-wrap break-words" key={index}>
            {line}
          </span>
        ))}
      </CodeBlockContent>
    </CodeBlock>
  )
}
