import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"
import ProductViewer from "@/components/product-viewers"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import {
  claimPublicExecutionResult,
  getPublicExecutionResultMetadata,
  type PublicExecutionResultMetadata,
} from "@/lib/public-execution-api"

export type ResultsHandle = {
  connect: (executionId: string) => Promise<void>
}

type ClaimedResult = {
  metadata: PublicExecutionResultMetadata
  result: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function getResultFileName(data: string): string | null {
  try {
    const event: unknown = JSON.parse(data)
    if (
      !isRecord(event) ||
      event.type !== "result" ||
      typeof event.message !== "string"
    ) {
      return null
    }

    return event.message
  } catch {
    return null
  }
}

const Results = forwardRef<ResultsHandle>(function Results(_props, ref) {
  const [fileNames, setFileNames] = useState<string[]>([])
  const [executionId, setExecutionId] = useState<string | null>(null)
  const [openResultFile, setOpenResultFile] = useState<string | null>(null)
  const [claimedResults, setClaimedResults] = useState<
    Record<string, ClaimedResult>
  >({})
  const [claimingFileNames, setClaimingFileNames] = useState<Set<string>>(
    () => new Set()
  )
  const [claimErrors, setClaimErrors] = useState<Record<string, string>>({})
  const claimRequestsRef = useRef(new Set<string>())
  const socketRef = useRef<WebSocket | null>(null)
  const viewportRef = useRef<HTMLDivElement>(null)

  useImperativeHandle(
    ref,
    () => ({
      connect: (executionId) =>
        new Promise<void>((resolve, reject) => {
          setExecutionId(executionId)
          setFileNames([])
          setOpenResultFile(null)
          setClaimedResults({})
          setClaimingFileNames(new Set())
          setClaimErrors({})
          claimRequestsRef.current.clear()
          viewportRef.current?.scrollTo({ top: 0 })

          socketRef.current?.close()

          const url = new URL(`/api/v1/ws/${executionId}`, window.location.href)
          url.protocol = url.protocol === "https:" ? "wss:" : "ws:"
          const socket = new WebSocket(url)
          socketRef.current = socket

          socket.onopen = () => {
            if (socketRef.current === socket) {
              resolve()
            }
          }

          socket.onmessage = (message) => {
            if (socketRef.current !== socket) {
              return
            }

            const fileName = getResultFileName(String(message.data))
            if (fileName !== null) {
              setFileNames((currentFileNames) =>
                currentFileNames.includes(fileName)
                  ? currentFileNames
                  : [...currentFileNames, fileName]
              )
            }
          }

          socket.onerror = () => {
            if (socketRef.current === socket) {
              reject(new Error("Could not connect to the results websocket."))
            }
          }

          socket.onclose = () => {
            if (socketRef.current === socket) {
              reject(
                new Error("The results websocket closed before connecting.")
              )
            }
          }
        }),
    }),
    []
  )

  async function handleClaim(fileName: string) {
    if (!executionId || claimRequestsRef.current.has(fileName)) {
      return
    }

    claimRequestsRef.current.add(fileName)
    setClaimingFileNames((current) => new Set(current).add(fileName))
    setClaimErrors((current) => {
      const next = { ...current }
      delete next[fileName]
      return next
    })

    try {
      const metadata = await getPublicExecutionResultMetadata(
        executionId,
        fileName
      )
      const result = await claimPublicExecutionResult(executionId, fileName)
      setClaimedResults((current) => ({
        ...current,
        [fileName]: { metadata, result },
      }))
      setOpenResultFile(fileName)
    } catch (error) {
      setClaimErrors((current) => ({
        ...current,
        [fileName]:
          error instanceof Error ? error.message : "Failed to claim result.",
      }))
    } finally {
      claimRequestsRef.current.delete(fileName)
      setClaimingFileNames((current) => {
        const next = new Set(current)
        next.delete(fileName)
        return next
      })
    }
  }

  useEffect(() => {
    return () => {
      socketRef.current?.close()
      socketRef.current = null
    }
  }, [])

  useEffect(() => {
    viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight })
  }, [fileNames])

  return (
    <div className="flex h-full w-full flex-col">
      <div
        ref={viewportRef}
        role="log"
        aria-live="polite"
        className="min-h-0 flex-1 overflow-auto p-2 font-mono text-xsm"
        style={{
          scrollbarColor: "var(--muted-foreground) var(--background)",
        }}
      >
        {fileNames.length === 0 ? (
          <p className="text-muted-foreground">No results yet.</p>
        ) : (
          <Accordion
            value={openResultFile ? [openResultFile] : []}
            onValueChange={(value) => setOpenResultFile(value[0] ?? null)}
          >
            {fileNames.map((fileName) => (
              <AccordionItem key={fileName} value={fileName}>
                <div className="flex w-full items-center gap-2">
                  <AccordionTrigger>{fileName}</AccordionTrigger>
                  <Button
                    variant="secondary"
                    disabled={
                      !executionId ||
                      Boolean(claimedResults[fileName]) ||
                      claimingFileNames.has(fileName)
                    }
                    onClick={() => void handleClaim(fileName)}
                  >
                    {claimedResults[fileName]
                      ? "Claimed"
                      : claimingFileNames.has(fileName)
                        ? "Claiming..."
                        : "Claim"}
                  </Button>
                </div>
                <AccordionContent>
                  {claimedResults[fileName] && (
                    <ProductViewer
                      metadata={claimedResults[fileName].metadata}
                      result={claimedResults[fileName].result}
                    />
                  )}
                  {claimErrors[fileName] && (
                    <p className="text-destructive" role="alert">
                      {claimErrors[fileName]}
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  )
})

export default Results
