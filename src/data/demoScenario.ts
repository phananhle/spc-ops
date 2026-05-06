import type { Scenario, SensorPoint } from './types'

const buildPoints = (
  values: number[],
  mean: number,
  ucl: number,
  lcl: number,
  anomalyStart = 19,
): SensorPoint[] =>
  values.map((value, index) => ({
    sample: index + 1,
    value,
    mean,
    ucl,
    lcl,
    isAnomaly: index + 1 >= anomalyStart,
  }))

export const demoScenario: Scenario = {
  id: 'pipe-diameter-drift-demo',
  title: 'Pipe extrusion diameter drift',
  summary:
    'A pipe extrusion line has started producing parts near the upper diameter limit after a resin lot change and cooling adjustment.',
  line: 'Extrusion Line 2',
  product: 'HDPE irrigation pipe, 40 mm nominal diameter',
  objectives: [
    'Identify which sensor stream first shows abnormal behavior.',
    'Describe whether the pattern looks like common-cause variation, a shift, or a trend.',
    'Connect the chart evidence to a plausible manufacturing root cause.',
  ],
  sensors: [
    {
      key: 'diameter',
      label: 'Outer Diameter',
      unit: 'mm',
      description: 'Pipe outer diameter measured after the cooling bath.',
      points: buildPoints(
        [
          40.01, 39.98, 40.03, 40.02, 39.99, 40.04, 40.00, 40.02, 39.97, 40.01,
          40.03, 40.00, 40.04, 40.06, 40.07, 40.09, 40.12, 40.15, 40.18, 40.22,
          40.25, 40.27, 40.30, 40.34,
        ],
        40.05,
        40.32,
        39.78,
        17,
      ),
    },
    {
      key: 'pressure',
      label: 'Melt Pressure',
      unit: 'bar',
      description: 'Extruder melt pressure before the die head.',
      points: buildPoints(
        [
          118.2, 119.1, 117.8, 118.6, 119.3, 118.4, 120.0, 119.6, 118.9, 119.2,
          120.1, 119.5, 120.4, 121.0, 121.5, 122.1, 122.8, 123.4, 124.0, 124.8,
          125.1, 125.7, 126.2, 126.8,
        ],
        119.5,
        126.5,
        112.5,
        18,
      ),
    },
    {
      key: 'temperature',
      label: 'Cooling Bath Temp',
      unit: 'C',
      description: 'Average cooling bath temperature near the sizing sleeve.',
      points: buildPoints(
        [
          19.8, 20.0, 20.1, 19.9, 20.2, 20.1, 20.0, 20.3, 20.1, 20.2, 20.4, 20.5,
          20.7, 20.9, 21.0, 21.2, 21.4, 21.5, 21.7, 21.8, 22.0, 22.1, 22.2, 22.4,
        ],
        20.2,
        22.1,
        18.3,
        16,
      ),
    },
    {
      key: 'wallThickness',
      label: 'Wall Thickness',
      unit: 'mm',
      description: 'Ultrasonic wall thickness measurement after puller station.',
      points: buildPoints(
        [
          3.01, 3.02, 2.99, 3.00, 3.01, 2.98, 3.02, 3.00, 2.99, 3.01, 3.00, 3.02,
          3.01, 3.00, 2.99, 3.01, 3.02, 3.00, 3.01, 2.99, 3.00, 3.01, 3.02, 3.00,
        ],
        3.0,
        3.08,
        2.92,
        99,
      ),
    },
  ],
  logs: [
    {
      time: '08:10',
      source: 'Material handling',
      message: 'Operator loaded resin lot B-447 after lot A-312 ran out.',
    },
    {
      time: '08:35',
      source: 'Line operator',
      message: 'Cooling bath valve adjusted to reduce visible pipe ovality.',
    },
    {
      time: '09:05',
      source: 'Quality check',
      message: 'Diameter readings are still in spec, but trending high.',
    },
    {
      time: '09:40',
      source: 'Maintenance',
      message: 'No puller speed alarms. Vacuum sizing pump sounds normal.',
    },
  ],
  groundTruth: {
    anomalyType: 'Western Electric trend / sustained upward drift',
    rootCause: 'Cooling bath temperature increased after adjustment, causing pipe diameter growth.',
    teachingFocus: [
      'Compare related sensors instead of judging one chart in isolation.',
      'Notice the trend before points cross the control limit.',
      'Use logs as evidence, not as a replacement for chart interpretation.',
    ],
  },
}
