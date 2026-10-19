import ReactFlowEditor from "@/components/react-flow/react-flow-editor"

export function App() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="flex w-full max-w-3xl h-[400px] flex-col border rounded-sm p-6">
        <ReactFlowEditor />
      </div>
    </div>
  )
}

export default App