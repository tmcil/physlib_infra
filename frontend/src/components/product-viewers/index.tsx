import type { ComponentType } from "react"
import type { PublicExecutionResultMetadata } from "@/lib/public-execution-api"
import EphViewer from "./eph"
import RawContent from "./raw-content"

export type ProductViewerProps = {
  metadata: PublicExecutionResultMetadata
  result: string
}

const productViewers: Partial<Record<string, ComponentType<ProductViewerProps>>> =
  {
    EPH: EphViewer,
  }

export default function ProductViewer({
  metadata,
  result,
}: ProductViewerProps) {
  const Viewer = productViewers[metadata.type]

  return (
    <div className="space-y-3">
      {Viewer ? (
        <Viewer metadata={metadata} result={result} />
      ) : (
        <p className="text-muted-foreground">
          No viewer is registered for product type &quot;{metadata.type}&quot;.
        </p>
      )}
      <RawContent content={result} />
    </div>
  )
}
