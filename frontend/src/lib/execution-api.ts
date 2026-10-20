import type { BlockEdge } from "@/components/react-flow/edges"
import type { AppNode } from "@/components/react-flow/nodes"

export type ExecutionRunPayload = {
  nodes: AppNode[]
  edges: BlockEdge[]
}

export async function submitExecution(
  payload: ExecutionRunPayload,
  token?: string
): Promise<void> {
  const endpoint = "/api/v1/executions/"

  const headers = new Headers({
    "Content-Type": "application/json",
  })
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(
      `Failed to schedule analysis (${response.status} ${response.statusText})${details ? `: ${details}` : ""}`
    )
  }
}
