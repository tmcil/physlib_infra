import { useHighlightedCode } from "@/hooks/use-highlighted-code"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { CodeBlock, CodeBlockContent } from "@/components/ui/code-block"

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
    <Accordion defaultValue={[]} className="rounded-lg border px-2">
      <AccordionItem value="raw-content" className="border-0">
        <AccordionTrigger>Raw content</AccordionTrigger>
        <AccordionContent>
          <CodeBlock size="sm" aria-label="Raw content">
            <CodeBlockContent
              wrap
              className="text-[11px] leading-tight"
              style={{
                scrollbarColor: "var(--muted-foreground) var(--background)",
              }}
            >
              {highlightedLines.map((line, index) => (
                <span
                  className="block break-words whitespace-pre-wrap"
                  key={index}
                >
                  {line}
                </span>
              ))}
            </CodeBlockContent>
          </CodeBlock>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
