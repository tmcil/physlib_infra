import type { BlockEdge } from "@/components/react-flow/edges"
import type { AppNode } from "@/components/react-flow/nodes"
import {
  fromBlockGraphDocument,
  isBlockGraphDocument,
  toBlockGraphDocument,
} from "@/lib/block-graph"

export type ExecutionCreatePayload = {
  name: string
  nodes: AppNode[]
  edges: BlockEdge[]
}

type ExecutionGraph = Pick<ExecutionCreatePayload, "nodes" | "edges">

export type ExecutionCreateResponse = {
  id: string
  status: string
}

export type PublicExecutionResultMetadata = {
  type: string
  status: "AVAILABLE" | "CLAIMED" | "EXPIRED"
  claimed: boolean
  expires_at: string
  file: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isExecutionGraph(value: unknown): value is ExecutionGraph {
  if (!isRecord(value)) {
    return false
  }

  return Array.isArray(value.nodes) && Array.isArray(value.edges)
}

// 1. Get a template execution from the database
export async function getTemplateExecution(executionId: string): Promise<ExecutionGraph> {
  const endpoint = `/api/v1/public/executions/${executionId}/`
  const headers = new Headers({
    "Content-Type": "application/json",
  })

  const response = await fetch(endpoint, {
    method: "GET",
    headers,
  })
  
  if (!response.ok) {
    const details = await response.text()
    throw new Error(
      `Failed to get template execution (${response.status} ${response.statusText})${details ? `: ${details}` : ""}`
    )
  }

  const execution: unknown = await response.json()
  if (!isRecord(execution) || !("block_graph" in execution)) {
    throw new Error(
      "Failed to load template execution: response is missing block_graph."
    )
  }

  if (isExecutionGraph(execution.block_graph)) {
    return execution.block_graph
  }
  if (isBlockGraphDocument(execution.block_graph)) {
    return fromBlockGraphDocument(execution.block_graph)
  }

  throw new Error(
    "Failed to load template execution: block_graph must contain nodes and edges or a blockGraph array."
  )
}

// 2. Create a new execution (from the template) in the database
export async function createPublicExecution(
  payload: ExecutionCreatePayload
): Promise<ExecutionCreateResponse> {
  const endpoint = `/api/v1/public/executions/`
  const headers = new Headers({
    "Content-Type": "application/json",
  })

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: payload.name,
      block_graph: toBlockGraphDocument(payload.nodes, payload.edges),
    })
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(
      `Failed to create execution (${response.status} ${response.statusText})${details ? `: ${details}` : ""}`
    )
  }

  return await response.json()
}

// 2b. Patch the existing execution in the database (used after 1st creation)
export async function patchPublicExecution(
  executionId: string,
  payload: ExecutionCreatePayload
): Promise<ExecutionCreateResponse> {
  const endpoint = `/api/v1/public/executions/${executionId}`
  const headers = new Headers({
    "Content-Type": "application/json",
  })

  const response = await fetch(endpoint, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      name: payload.name,
      block_graph: toBlockGraphDocument(payload.nodes, payload.edges),
    })
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(
      `Failed to patch execution (${response.status} ${response.statusText})${details ? `: ${details}` : ""}`
    )
  }

  return await response.json()
}

// 3. Run the execution
export async function runPublicExecution(executionId: string): Promise<void> {
  const endpoint = `/api/v1/public/executions/${executionId}/run/`
  const headers = new Headers({
    "Content-Type": "application/json",
  })
  
  const response = await fetch(endpoint, {
    method: "POST",
    headers,
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(
      `Failed to run execution (${response.status} ${response.statusText})${details ? `: ${details}` : ""}`
    )
  }
}

// 4. Get result metadata from the execution
export async function getPublicExecutionResultMetadata(
  executionId: string,
  resultFilename: string
): Promise<PublicExecutionResultMetadata> {
  const endpoint = `/api/v1/public/executions/${executionId}/results/${encodeURIComponent(resultFilename)}`
  const response = await fetch(endpoint, {
    method: "GET",
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(
      `Failed to get execution result metadata (${response.status} ${response.statusText})${details ? `: ${details}` : ""}`
    )
  }

  return await response.json()
}

// 5. Claim a result from the execution
export async function claimPublicExecutionResult(
  executionId: string,
  resultFilename: string
): Promise<string> {
  const endpoint = `/api/v1/public/executions/${executionId}/results/${encodeURIComponent(resultFilename)}/claim`
  const response = await fetch(endpoint, {
    method: "GET",
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(
      `Failed to claim execution result (${response.status} ${response.statusText})${details ? `: ${details}` : ""}`
    )
  }

  return await response.text()
}

/* export async function submitExecution(
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
} */
