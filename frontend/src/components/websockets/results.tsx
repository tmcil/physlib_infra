import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"

export type ResultsHandle = {
  connect: (executionId: string) => Promise<void>
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
  const socketRef = useRef<WebSocket | null>(null)
  const viewportRef = useRef<HTMLDivElement>(null)

  useImperativeHandle(
    ref,
    () => ({
      connect: (executionId) =>
        new Promise<void>((resolve, reject) => {
          setFileNames([])
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
        className="text-xsm min-h-0 flex-1 overflow-auto px-2 pt-0 pb-2 font-sans"
      >
        {fileNames.length === 0 ? (
          <p className="text-muted-foreground">No results yet.</p>
        ) : (
          <Accordion>
            {fileNames.map((fileName) => (
              <AccordionItem key={fileName} value={fileName}>
                <div className="flex w-full items-center gap-2">
                  <AccordionTrigger>{fileName}</AccordionTrigger>
                  <Button
                    variant="secondary"
                  >
                    Load
                  </Button>
                </div>
                <AccordionContent>
                  Hello, world!
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
