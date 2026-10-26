import { useEffect, useMemo, useRef, useState } from "react"
import {
  Cartesian2,
  Cartesian3,
  Clock as CesiumClock,
  ClockRange,
  Color,
  Ellipsoid,
  HorizontalOrigin,
  ImageryLayer,
  JulianDate,
  LabelStyle,
  Matrix3,
  OpenStreetMapImageryProvider,
  Rectangle,
  SceneMode,
  SampledPositionProperty,
  TimeInterval,
  TimeIntervalCollection,
  Transforms,
} from "cesium"
import {
  CameraFlyTo,
  BillboardGraphics,
  Clock,
  Entity,
  LabelGraphics,
  PathGraphics,
  PolylineGraphics,
  Viewer,
  useCesium,
} from "resium"
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import type { ProductViewerProps } from "./index"

const crosshairImage = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="6.5" fill="none" stroke="white" stroke-width="1.5"/><path d="M12 0v7M12 17v7M0 12h7M17 12h7" stroke="white" stroke-width="1.5"/></svg>'
)}`

type EphemerisSample = {
  epoch: string
  position: Cartesian3
  groundPosition: Cartesian3
  longitude: number
  stateVector: [number, number, number, number, number, number]
}

type ViewerMode = "3d" | "2d"

type EphemerisAnimation = {
  positions: SampledPositionProperty
  groundPositions: SampledPositionProperty
  start: JulianDate
  stop: JulianDate
  interval: TimeIntervalCollection
}

type ParsedEphemeris =
  | {
      samples: EphemerisSample[]
      scale: number
      error: null
    }
  | {
      samples: null
      scale: null
      error: string
    }

const emptyEphemeris: ParsedEphemeris = {
  samples: null,
  scale: null,
  error: null,
}

type StateVector = [number, number, number, number, number, number, ...number[]]

const stateVectorSeries = [
  { key: "r1", label: "X (km)", color: "#38bdf8", axis: "position" },
  { key: "r2", label: "Y (km)", color: "#f97316", axis: "position" },
  { key: "r3", label: "Z (km)", color: "#a3e635", axis: "position" },
  { key: "v1", label: "VX (km/s)", color: "#e879f9", axis: "velocity" },
  { key: "v2", label: "VY (km/s)", color: "#facc15", axis: "velocity" },
  { key: "v3", label: "VZ (km/s)", color: "#2dd4bf", axis: "velocity" },
] as const

type StateVectorSeriesKey = (typeof stateVectorSeries)[number]["key"]

type StateVectorChartPoint = {
  epoch: number
} & Record<StateVectorSeriesKey, number>

function GroundTrackCameraFollower({
  position,
}: {
  position: SampledPositionProperty
}) {
  const { scene } = useCesium()

  useEffect(() => {
    if (!scene || scene.mode !== SceneMode.SCENE2D) {
      return
    }

    const followObject = () => {
      const camera = scene.camera
      const groundPosition = position.getValue(scene.frameState.time)
      const cartographic =
        groundPosition &&
        Ellipsoid.WGS84.cartesianToCartographic(groundPosition)
      if (!cartographic) {
        return
      }

      const current = camera.positionCartographic
      if (
        Math.abs(current.longitude - cartographic.longitude) < 1e-7 &&
        Math.abs(current.latitude - cartographic.latitude) < 1e-7
      ) {
        return
      }

      camera.setView({
        destination: Cartesian3.fromRadians(
          cartographic.longitude,
          cartographic.latitude,
          current.height
        ),
        orientation: {
          heading: camera.heading,
          pitch: camera.pitch,
          roll: camera.roll,
        },
      })
    }

    scene.preRender.addEventListener(followObject)
    followObject()
    return () => {
      scene.preRender.removeEventListener(followObject)
    }
  }, [position, scene])

  return null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isStateVector(value: unknown): value is StateVector {
  return (
    Array.isArray(value) &&
    value.length >= 6 &&
    value
      .slice(0, 6)
      .every(
        (coordinate) =>
          typeof coordinate === "number" && Number.isFinite(coordinate)
      )
  )
}

function isValidEpoch(value: string): boolean {
  if (Number.isFinite(Date.parse(value))) {
    return true
  }

  const carriedSeconds = value.match(
    /^(.*T\d{2}:\d{2}:)60((?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))$/
  )
  if (!carriedSeconds) {
    return false
  }

  const normalized = `${carriedSeconds[1]}00${carriedSeconds[2]}`
  const timestamp = Date.parse(normalized)
  return Number.isFinite(timestamp) && Number.isFinite(timestamp + 60_000)
}

function normalizeEpoch(value: string): string {
  const carriedSeconds = value.match(
    /^(.*T\d{2}:\d{2}:)60((?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))$/
  )
  if (!carriedSeconds) {
    return value
  }

  const normalized = `${carriedSeconds[1]}00${carriedSeconds[2]}`
  const timestamp = Date.parse(normalized)
  return Number.isFinite(timestamp)
    ? new Date(timestamp + 60_000).toISOString()
    : value
}

async function parseEphemeris(content: string): Promise<ParsedEphemeris> {
  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    return {
      samples: null,
      scale: null,
      error: "The ephemeris result is not valid JSON.",
    }
  }

  if (!isRecord(parsed) || !Array.isArray(parsed.data)) {
    return {
      samples: null,
      scale: null,
      error: "The ephemeris result must contain a data array.",
    }
  }

  const scale = parsed.metersScaleFactor
  if (typeof scale !== "number" || !Number.isFinite(scale) || scale <= 0) {
    return {
      samples: null,
      scale: null,
      error: "The ephemeris result has an invalid metersScaleFactor.",
    }
  }

  const rawSamples: {
    epoch: string
    date: JulianDate
    position: Cartesian3
    stateVector: EphemerisSample["stateVector"]
  }[] = []

  for (const [index, item] of parsed.data.entries()) {
    if (
      !isRecord(item) ||
      typeof item.epoch !== "string" ||
      !isValidEpoch(item.epoch) ||
      !isStateVector(item.vec)
    ) {
      return {
        samples: null,
        scale: null,
        error: `Ephemeris sample ${index + 1} must contain a valid epoch and six numeric state-vector components.`,
      }
    }

    const [x, y, z, vx, vy, vz] = item.vec
    const epoch = normalizeEpoch(item.epoch)
    const date = JulianDate.fromIso8601(epoch)
    rawSamples.push({
      epoch,
      date,
      position: new Cartesian3(x * scale, y * scale, z * scale),
      stateVector: [
        (x * scale) / 1000,
        (y * scale) / 1000,
        (z * scale) / 1000,
        (vx * scale) / 1000,
        (vy * scale) / 1000,
        (vz * scale) / 1000,
      ],
    })
  }

  if (rawSamples.length === 0) {
    return {
      samples: null,
      scale: null,
      error: "The ephemeris contains no data points.",
    }
  }

  const start = rawSamples[0].date
  const stop = rawSamples[rawSamples.length - 1].date
  await Transforms.preloadIcrfFixed(new TimeInterval({ start, stop }))

  const samples: EphemerisSample[] = []
  for (const [index, sample] of rawSamples.entries()) {
    const gcrfToFixed = Transforms.computeIcrfToCentralBodyFixedMatrix(
      sample.date
    )
    if (!gcrfToFixed) {
      return {
        samples: null,
        scale: null,
        error: `Ephemeris sample ${index + 1} could not be transformed from GCRF to Earth-fixed coordinates.`,
      }
    }

    const position = Matrix3.multiplyByVector(
      gcrfToFixed,
      sample.position,
      new Cartesian3()
    )
    const cartographic = Ellipsoid.WGS84.cartesianToCartographic(position)
    if (!cartographic) {
      return {
        samples: null,
        scale: null,
        error: `Ephemeris sample ${index + 1} could not be projected onto Earth.`,
      }
    }

    samples.push({
      epoch: sample.epoch,
      position,
      groundPosition: Cartesian3.fromRadians(
        cartographic.longitude,
        cartographic.latitude,
        0,
        Ellipsoid.WGS84
      ),
      longitude: cartographic.longitude,
      stateVector: sample.stateVector,
    })
  }

  return { samples, scale, error: null }
}

function splitGroundTrack(samples: EphemerisSample[]): Cartesian3[][] {
  const segments: Cartesian3[][] = []
  let segment: Cartesian3[] = []
  let previousLongitude: number | null = null

  for (const sample of samples) {
    if (
      previousLongitude !== null &&
      Math.abs(sample.longitude - previousLongitude) > Math.PI
    ) {
      if (segment.length > 1) {
        segments.push(segment)
      }
      segment = []
    }

    segment.push(sample.groundPosition)
    previousLongitude = sample.longitude
  }

  if (segment.length > 1) {
    segments.push(segment)
  }

  return segments
}

function EphemerisScene({
  samples,
  animation,
  viewerMode,
  playbackKey,
  playbackSpeed,
  playbackTime,
  onClockTick,
  groundTrackSegments,
}: {
  samples: EphemerisSample[]
  animation: EphemerisAnimation
  viewerMode: ViewerMode
  playbackKey: number
  playbackSpeed: number
  playbackTime: JulianDate
  onClockTick: (clock: CesiumClock) => void
  groundTrackSegments: Cartesian3[][]
}) {
  const earthImagery = useMemo(
    () =>
      new ImageryLayer(
        new OpenStreetMapImageryProvider({
          url: "https://tile.openstreetmap.org/",
        })
      ),
    []
  )
  const initialCamera = useMemo(() => {
    const satellitePosition = samples[0].position
    const surfaceDirection = Cartesian3.normalize(
      satellitePosition,
      new Cartesian3()
    )
    const destination = Cartesian3.add(
      satellitePosition,
      Cartesian3.multiplyByScalar(
        surfaceDirection,
        1_000_000,
        new Cartesian3()
      ),
      new Cartesian3()
    )
    const direction = Cartesian3.negate(surfaceDirection, new Cartesian3())
    const up =
      Math.abs(Cartesian3.dot(direction, Cartesian3.UNIT_Z)) > 0.95
        ? Cartesian3.UNIT_Y
        : Cartesian3.UNIT_Z

    return {
      destination,
      orientation: { direction, up },
      duration: 0,
      convert: false,
      once: true,
    }
  }, [samples])
  const initialGroundTrackCamera = useMemo(() => {
    const groundPosition =
      animation.groundPositions.getValue(playbackTime) ??
      samples[0].groundPosition
    const cartographic =
      Ellipsoid.WGS84.cartesianToCartographic(groundPosition) ??
      Ellipsoid.WGS84.cartesianToCartographic(samples[0].groundPosition)
    if (!cartographic) {
      return null
    }

    const latitudeRadius = 0.3
    const longitudeRadius = 0.3
    return {
      destination: Rectangle.fromRadians(
        cartographic.longitude - longitudeRadius,
        Math.max(-Math.PI / 2, cartographic.latitude - latitudeRadius),
        cartographic.longitude + longitudeRadius,
        Math.min(Math.PI / 2, cartographic.latitude + latitudeRadius)
      ),
      duration: 0,
      once: true,
    }
  }, [animation.groundPositions, playbackTime, samples])

  return (
    <div className="h-80 overflow-hidden rounded-md border">
      <Viewer
        full
        baseLayer={earthImagery}
        sceneMode={viewerMode === "3d" ? SceneMode.SCENE3D : SceneMode.SCENE2D}
        animation={false}
        baseLayerPicker={false}
        fullscreenButton={false}
        geocoder={false}
        homeButton={false}
        infoBox={false}
        navigationHelpButton={false}
        sceneModePicker={false}
        selectionIndicator={false}
        timeline={false}
        shouldAnimate={false}
        style={{ position: "relative", height: "100%", width: "100%" }}
      >
        {viewerMode === "3d" ? (
          <CameraFlyTo {...initialCamera} />
        ) : (
          initialGroundTrackCamera && (
            <CameraFlyTo {...initialGroundTrackCamera} />
          )
        )}
        {viewerMode === "2d" && (
          <GroundTrackCameraFollower position={animation.groundPositions} />
        )}
        <Clock
          startTime={animation.start}
          stopTime={animation.stop}
          currentTime={playbackTime}
          clockRange={ClockRange.CLAMPED}
          multiplier={playbackSpeed}
          shouldAnimate={playbackKey > 0 && playbackSpeed !== 0}
          onTick={onClockTick}
        />
        <Entity
          name="Ephemeris satellite"
          availability={animation.interval}
          position={
            viewerMode === "3d"
              ? animation.positions
              : animation.groundPositions
          }
          tracked={
            viewerMode === "3d" && playbackKey > 0 && playbackSpeed !== 0
          }
          viewFrom={
            viewerMode === "3d"
              ? new Cartesian3(0, -1_000_000, 500_000)
              : Cartesian3.ZERO
          }
        >
          <BillboardGraphics
            image={crosshairImage}
            width={20}
            height={20}
            disableDepthTestDistance={Number.POSITIVE_INFINITY}
          />
          <LabelGraphics
            text="object"
            font='bold 12px "Inter Variable"'
            style={LabelStyle.FILL_AND_OUTLINE}
            fillColor={Color.WHITE}
            outlineColor={Color.BLACK}
            outlineWidth={3}
            showBackground
            backgroundColor={Color.BLACK.withAlpha(0.65)}
            backgroundPadding={new Cartesian2(5, 3)}
            horizontalOrigin={HorizontalOrigin.LEFT}
            pixelOffset={new Cartesian2(13, 0)}
            disableDepthTestDistance={Number.POSITIVE_INFINITY}
          />
          {viewerMode === "3d" && (
            <PathGraphics
              leadTime={0}
              trailTime={Number.POSITIVE_INFINITY}
              width={2}
              material={Color.CYAN}
            />
          )}
        </Entity>
        {viewerMode === "3d" ? (
          <Entity name="Trajectory">
            <PolylineGraphics
              positions={samples.map((sample) => sample.position)}
              width={1}
              material={Color.CYAN.withAlpha(0.35)}
            />
          </Entity>
        ) : (
          groundTrackSegments.map((positions, index) => (
            <Entity key={index} name={`Ground track ${index + 1}`}>
              <PolylineGraphics
                positions={positions}
                width={2}
                material={Color.CYAN}
              />
            </Entity>
          ))
        )}
      </Viewer>
    </div>
  )
}

export default function EphViewer({ result }: ProductViewerProps) {
  const [parsedResult, setParsedResult] = useState<{
    content: string
    parsed: ParsedEphemeris
  } | null>(null)
  const isLoading = parsedResult?.content !== result
  const parsed = isLoading ? emptyEphemeris : parsedResult.parsed
  const [playbackKey, setPlaybackKey] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const playbackTimeRef = useRef<JulianDate | null>(null)
  const [playbackTime, setPlaybackTime] = useState<JulianDate | null>(null)
  const [viewerMode, setViewerMode] = useState<ViewerMode>("3d")
  const [hiddenSeries, setHiddenSeries] = useState<Set<StateVectorSeriesKey>>(
    () => new Set()
  )

  useEffect(() => {
    let cancelled = false
    void parseEphemeris(result)
      .then((nextParsed) => {
        if (!cancelled) {
          playbackTimeRef.current = null
          setPlaybackTime(null)
          setParsedResult({ content: result, parsed: nextParsed })
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setParsedResult({
            content: result,
            parsed: {
              samples: null,
              scale: null,
              error: `Unable to load GCRF ephemeris data: ${error instanceof Error ? error.message : String(error)}`,
            },
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [result])

  const chartData = useMemo<StateVectorChartPoint[]>(() => {
    if (!parsed.samples) {
      return []
    }

    return parsed.samples.map((sample) => ({
      epoch: Date.parse(sample.epoch),
      r1: sample.stateVector[0],
      r2: sample.stateVector[1],
      r3: sample.stateVector[2],
      v1: sample.stateVector[3],
      v2: sample.stateVector[4],
      v3: sample.stateVector[5],
    }))
  }, [parsed])

  const toggleSeries = (key: StateVectorSeriesKey) => {
    setHiddenSeries((current) => {
      const next = new Set(current)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const animation = useMemo(() => {
    if (!parsed.samples) {
      return null
    }

    const positions = new SampledPositionProperty()
    const groundPositions = new SampledPositionProperty()
    const samples = parsed.samples
    for (const sample of samples) {
      const date = JulianDate.fromIso8601(sample.epoch)
      positions.addSample(date, sample.position)
      groundPositions.addSample(date, sample.groundPosition)
    }

    const start = JulianDate.fromIso8601(samples[0].epoch)
    const stop = JulianDate.fromIso8601(samples[samples.length - 1].epoch)
    positions.setInterpolationOptions({ degree: 1 })
    groundPositions.setInterpolationOptions({ degree: 1 })

    return {
      positions,
      groundPositions,
      start,
      stop,
      interval: new TimeIntervalCollection([new TimeInterval({ start, stop })]),
    }
  }, [parsed])

  const handlePlayFromStart = () => {
    if (animation) {
      const startTime = JulianDate.clone(
        playbackSpeed < 0 ? animation.stop : animation.start
      )
      playbackTimeRef.current = startTime
      setPlaybackTime(startTime)
    }
    setPlaybackKey((current) => current + 1)
  }

  const handleClockTick = (clock: CesiumClock) => {
    playbackTimeRef.current = JulianDate.clone(clock.currentTime)
  }

  const handleViewerModeChange = (mode: ViewerMode) => {
    playbackTimeRef.current ??= JulianDate.clone(animation.start)
    setPlaybackTime(JulianDate.clone(playbackTimeRef.current))
    setViewerMode(mode)
  }

  const groundTrackSegments = useMemo(
    () => (parsed.samples ? splitGroundTrack(parsed.samples) : []),
    [parsed]
  )

  if (parsed.error) {
    return (
      <Card size="sm" className="font-sans">
        <CardHeader>
          <CardTitle>Ephemeris Viewer</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive" role="alert">
            {parsed.error}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card size="sm" className="font-sans">
        <CardHeader>
          <CardTitle>Ephemeris Viewer</CardTitle>
        </CardHeader>
        <CardContent>
          <p role="status">Loading ephemeris data...</p>
        </CardContent>
      </Card>
    )
  }

  if (!animation || !parsed.samples) {
    return null
  }

  return (
    <div className="space-y-3 font-sans">
      <Card size="sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ephemeris Viewer</CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex gap-1" role="group" aria-label="Globe view">
              <Button
                type="button"
                size="sm"
                variant={viewerMode === "3d" ? "default" : "outline"}
                aria-pressed={viewerMode === "3d"}
                onClick={() => handleViewerModeChange("3d")}
              >
                3D
              </Button>
              <Button
                type="button"
                size="sm"
                variant={viewerMode === "2d" ? "default" : "outline"}
                aria-pressed={viewerMode === "2d"}
                onClick={() => handleViewerModeChange("2d")}
              >
                2D Ground track
              </Button>
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={handlePlayFromStart}
            >
              Play from {playbackSpeed < 0 ? "end" : "start"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <EphemerisScene
            key={viewerMode}
            samples={parsed.samples}
            animation={animation}
            viewerMode={viewerMode}
            playbackKey={playbackKey}
            playbackSpeed={playbackSpeed}
            playbackTime={playbackTime ?? animation.start}
            onClockTick={handleClockTick}
            groundTrackSegments={groundTrackSegments}
          />
          <div className="flex items-center gap-3">
            <label
              htmlFor="ephemeris-playback-speed"
              className="shrink-0 text-sm font-medium"
            >
              Playback speed
            </label>
            <Slider
              id="ephemeris-playback-speed"
              min={-50}
              max={50}
              step={0.1}
              value={playbackSpeed}
              onValueChange={setPlaybackSpeed}
              className="min-w-0 flex-1"
              aria-label="Playback speed"
              getAriaValueText={() =>
                `${playbackSpeed} times real time${playbackSpeed === 0 ? ", paused" : playbackSpeed < 0 ? ", reverse" : ""}`
              }
            />
            <output
              htmlFor="ephemeris-playback-speed"
              className="w-28 shrink-0 text-right text-sm text-muted-foreground tabular-nums"
            >
              {playbackSpeed === 0
                ? "Paused (0×)"
                : `${playbackSpeed}× real time`}
            </output>
          </div>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>State Vector Plot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {stateVectorSeries.map((series) => (
              <label
                className="flex cursor-pointer items-center gap-2 text-xs"
                key={series.key}
              >
                <Checkbox
                  checked={!hiddenSeries.has(series.key)}
                  onCheckedChange={() => toggleSeries(series.key)}
                  aria-label={`Toggle ${series.label}`}
                />
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: series.color }}
                />
                <span>{series.label}</span>
              </label>
            ))}
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
              >
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="epoch"
                  type="number"
                  scale="time"
                  domain={["dataMin", "dataMax"]}
                  height={48}
                  minTickGap={36}
                  tick={({ x, y, payload }) => {
                    const date = new Date(Number(payload.value))
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text
                          fill="var(--muted-foreground)"
                          fontSize={10}
                          textAnchor="middle"
                        >
                          <tspan x={0} dy={0}>
                            {date.toLocaleTimeString()}
                          </tspan>
                          <tspan x={0} dy={12}>
                            {date.toLocaleDateString()}
                          </tspan>
                        </text>
                      </g>
                    )
                  }}
                />
                <YAxis
                  yAxisId="position"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  width={58}
                />
                <YAxis
                  yAxisId="velocity"
                  orientation="right"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  width={58}
                />
                <Tooltip
                  labelFormatter={(value) =>
                    new Date(Number(value)).toLocaleString()
                  }
                  formatter={(value, name) => [
                    typeof value === "number"
                      ? value.toLocaleString(undefined, {
                          maximumFractionDigits: 3,
                        })
                      : value,
                    name,
                  ]}
                  contentStyle={{
                    backgroundColor: "var(--popover)",
                    borderColor: "var(--border)",
                    color: "var(--popover-foreground)",
                  }}
                />
                {stateVectorSeries.map((series) => (
                  <Line
                    key={series.key}
                    yAxisId={series.axis}
                    type="monotone"
                    dataKey={series.key}
                    name={series.label}
                    stroke={series.color}
                    dot={false}
                    activeDot={{ r: 3 }}
                    hide={hiddenSeries.has(series.key)}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
