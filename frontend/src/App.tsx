import { Button } from "@/components/ui/button"
import ReactFlowTest from "@/components/react-flow/react-flow-test"

export function App() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="flex w-full max-w-3xl h-[400px] flex-col border rounded-sm p-6">
        {/* <div>
          <h1 className="font-medium">Project ready!</h1>
          <p>You may now add components and start building.</p>
          <p>We&apos;ve already added the button component for you.</p>
          <Button className="mt-2">Button</Button>
        </div>
        <div className="font-mono text-xs text-muted-foreground">
          (Press <kbd>d</kbd> to toggle dark mode)
        </div> */}
        <ReactFlowTest />
      </div>
    </div>
  )
}

export default App