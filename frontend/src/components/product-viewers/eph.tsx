import type { ProductViewerProps } from "./index"

export default function EphViewer({ metadata, result }: ProductViewerProps) {
  return (
    <section>
      <h2>{metadata.type}</h2>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </section>
  )
}