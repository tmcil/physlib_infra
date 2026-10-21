import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"

export type LogsHandle = {
  connect: (executionId: string) => Promise<void>
}

function formatLogEvent(data: string): string {
  try {
    const event: unknown = JSON.parse(data)
    if (
      typeof event === "object" &&
      event !== null &&
      "message" in event &&
      typeof event.message === "string"
    ) {
      return event.message
    }

    return JSON.stringify(event, null, 2)
  } catch {
    return data
  }
}

const Logs = forwardRef<LogsHandle>(function Logs(_props, ref) {
  const [entries, setEntries] = useState<string[]>([])
  const socketRef = useRef<WebSocket | null>(null)
  const viewportRef = useRef<HTMLDivElement>(null)

  useImperativeHandle(ref, () => ({
    connect: (executionId) =>
      new Promise<void>((resolve, reject) => {
        setEntries([])
        viewportRef.current?.scrollTo({ top: 0 })

        socketRef.current?.close()

        const url = new URL(`/api/v1/ws/${executionId}`, window.location.href)
        url.protocol = url.protocol === "https:" ? "wss:" : "ws:"
        const socket = new WebSocket(url)
        socketRef.current = socket

        socket.onopen = () => {
          if (socketRef.current !== socket) {
            return
          }
          resolve()
        }

        socket.onmessage = (message) => {
          if (socketRef.current === socket) {
            setEntries((currentEntries) => [
              ...currentEntries,
              formatLogEvent(String(message.data)),
            ])
          }
        }

        socket.onerror = () => {
          if (socketRef.current === socket) {
            reject(new Error("Could not connect to the logs websocket."))
          }
        }

        socket.onclose = () => {
          if (socketRef.current === socket) {
            reject(new Error("The logs websocket closed before connecting."))
          }
        }
      }),
  }), [])

  useEffect(() => {
    return () => {
      socketRef.current?.close()
      socketRef.current = null
    }
  }, [])

  useEffect(() => {
    viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight })
  }, [entries])

  return (
    <div className="flex h-full w-full flex-col">
      <div
        ref={viewportRef}
        role="log"
        aria-live="polite"
        className="min-h-0 flex-1 overflow-auto p-2 font-mono text-xsm"
      >
        {entries.length === 0 ? (
          <p className="text-muted-foreground">No logs yet.</p>
        ) : (
          entries.map((entry, index) => (
            <pre key={index} className="text-[11px] leading-tight text-muted-foreground">
              {entry}
            </pre>
          ))
        )}
      </div>
    </div>
  )
})

export default Logs