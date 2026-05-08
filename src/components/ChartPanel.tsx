import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Scenario, SensorKey, SensorPoint, SensorStream } from '../data/types'
import './ChartPanel.css'

const MORPH_DURATION_MS = 600

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

const interpolatePoints = (from: SensorPoint[], to: SensorPoint[], t: number): SensorPoint[] => {
  return to.map((target, i) => {
    const source = from[i] ?? target
    return {
      ...target,
      value: lerp(source.value, target.value, t),
      mean: lerp(source.mean, target.mean, t),
      ucl: lerp(source.ucl, target.ucl, t),
      lcl: lerp(source.lcl, target.lcl, t),
    }
  })
}

type Props = {
  scenario: Scenario
  activeSensor: SensorStream
  activeSensorKey: SensorKey
  onSensorChange: (key: SensorKey) => void
}

const formatSigFigs = (value: number) => {
  if (!Number.isFinite(value)) return ''
  return value.toPrecision(4)
}

const axisUnitLabel = (unit: string) => {
  if (unit === 'C') return 'Degrees (C)'
  return unit
}

type SampleTimeTickProps = {
  x?: number
  y?: number
  payload?: { value: number }
  sampleToTime?: Map<number, string>
}

const SampleTimeTick = ({ x = 0, y = 0, payload, sampleToTime }: SampleTimeTickProps) => {
  const sample = payload?.value
  const time = sample !== undefined ? sampleToTime?.get(sample) ?? '' : ''
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={12} textAnchor="middle" fill="#475569" fontSize={11}>
        {sample}
      </text>
      <text x={0} y={0} dy={26} textAnchor="middle" fill="#94a3b8" fontSize={10}>
        {time}
      </text>
    </g>
  )
}

type ChartTooltipProps = {
  active?: boolean
  payload?: Array<{ payload: SensorPoint }>
}

const ChartTooltip = ({ active, payload }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-header">
        Sample {point.sample} · {point.time}
      </div>
      <div className="chart-tooltip-value">{formatSigFigs(point.value)}</div>
    </div>
  )
}

export function ChartPanel({ scenario, activeSensor, activeSensorKey, onSensorChange }: Props) {
  const [displayedPoints, setDisplayedPoints] = useState<SensorPoint[]>(activeSensor.points)
  const previousPointsRef = useRef<SensorPoint[]>(activeSensor.points)
  const isFirstRenderRef = useRef(true)

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false
      previousPointsRef.current = activeSensor.points
      setDisplayedPoints(activeSensor.points)
      return
    }

    const fromPoints = previousPointsRef.current
    const toPoints = activeSensor.points
    const start = performance.now()
    let rafId = 0

    const tick = (now: number) => {
      const elapsed = now - start
      const t = Math.min(1, elapsed / MORPH_DURATION_MS)
      const eased = easeInOutCubic(t)
      setDisplayedPoints(interpolatePoints(fromPoints, toPoints, eased))
      if (t < 1) {
        rafId = requestAnimationFrame(tick)
      } else {
        previousPointsRef.current = toPoints
      }
    }

    rafId = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(rafId)
      previousPointsRef.current = toPoints
    }
  }, [activeSensor])

  const anomalyWindow = useMemo(() => {
    const anomalyPoints = activeSensor.points.filter((point) => point.isAnomaly)
    if (anomalyPoints.length === 0) {
      return null
    }
    return {
      start: anomalyPoints[0].sample,
      end: anomalyPoints[anomalyPoints.length - 1].sample,
    }
  }, [activeSensor])

  const chartLayout = useMemo(() => {
    const points = displayedPoints
    const { ucl, mean, lcl } = points[0]
    const values = points.map((p) => p.value)
    const lo = Math.min(...values, lcl)
    const hi = Math.max(...values, ucl)
    const span = hi - lo || Math.abs(hi) || 1
    const pad = span * 0.08
    const sampleToTime = new Map<number, string>()
    for (const p of points) sampleToTime.set(p.sample, p.time)
    const sampleTicks: number[] = []
    for (let i = 5; i <= points.length; i += 5) sampleTicks.push(i)
    return {
      yDomain: [lo - pad, hi + pad] as [number, number],
      ucl,
      mean,
      lcl,
      sampleToTime,
      sampleTicks,
    }
  }, [displayedPoints])

  return (
    <div className="chart-panel panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Control chart</p>
          <h2>{activeSensor.label}</h2>
        </div>
        <span className="unit-pill">{activeSensor.unit}</span>
      </div>

      <p className="sensor-description">{activeSensor.description}</p>

      <div className="sensor-tabs" aria-label="Sensor streams">
        {scenario.sensors.map((sensor) => (
          <button
            className={sensor.key === activeSensorKey ? 'active' : ''}
            key={sensor.key}
            onClick={() => onSensorChange(sensor.key)}
            type="button"
          >
            {sensor.label}
          </button>
        ))}
      </div>

      <div className="chart-frame">
        <ResponsiveContainer height="100%" width="100%" minHeight={200} debounce={50}>
          <LineChart data={displayedPoints} margin={{ bottom: 36, left: 12, right: 56, top: 12 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="sample"
              height={64}
              ticks={chartLayout.sampleTicks}
              tick={<SampleTimeTick sampleToTime={chartLayout.sampleToTime} />}
              label={{
                value: 'Sample group · time',
                position: 'insideBottom',
                dy: 18,
                fill: '#475569',
                fontSize: 11,
              }}
            />
            <YAxis
              domain={chartLayout.yDomain}
              label={{
                value: axisUnitLabel(activeSensor.unit),
                angle: -90,
                position: 'insideLeft',
                dx: -4,
                fill: '#475569',
                fontSize: 11,
              }}
              tickFormatter={formatSigFigs}
              width={76}
            />
            <Tooltip content={<ChartTooltip />} />
            {anomalyWindow ? (
              <ReferenceArea
                fill="#f59e0b"
                fillOpacity={0.16}
                x1={anomalyWindow.start}
                x2={anomalyWindow.end}
              />
            ) : null}
            <ReferenceLine
              y={chartLayout.ucl}
              stroke="#dc2626"
              label={{ value: 'UCL', position: 'right', fill: '#dc2626', fontSize: 11, fontWeight: 700 }}
            />
            <ReferenceLine
              y={chartLayout.mean}
              stroke="#64748b"
              strokeDasharray="5 5"
              label={{ value: 'Mean', position: 'right', fill: '#64748b', fontSize: 11, fontWeight: 700 }}
            />
            <ReferenceLine
              y={chartLayout.lcl}
              stroke="#dc2626"
              label={{ value: 'LCL', position: 'right', fill: '#dc2626', fontSize: 11, fontWeight: 700 }}
            />
            <Line
              activeDot={{ r: 7 }}
              dataKey="value"
              dot={{ r: 3 }}
              isAnimationActive={false}
              name={activeSensor.label}
              stroke="#2563eb"
              strokeWidth={3}
              type="monotone"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-callout">
        <strong>Highlighted region:</strong>{' '}
        {anomalyWindow
          ? `Samples ${anomalyWindow.start}-${anomalyWindow.end} are out of control.`
          : 'This stream stays in control throughout.'}
      </div>
    </div>
  )
}
