import { Slider as SliderPrimitive } from "@base-ui/react/slider"
import { cn } from "cn"

function Slider({ className, ...props }: SliderPrimitive.Root.Props<number>) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn("relative flex w-full touch-none items-center", className)}
      {...props}
    >
      <SliderPrimitive.Control
        data-slot="slider-control"
        className="relative flex h-5 w-full items-center"
      >
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-secondary"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-indicator"
            className="absolute h-full bg-primary"
          />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          className="block size-4 shrink-0 rounded-full border border-primary bg-background shadow-sm transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
        />
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

export { Slider }
