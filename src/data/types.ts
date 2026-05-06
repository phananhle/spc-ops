export type SensorKey = 'pressure' | 'temperature' | 'diameter' | 'wallThickness'

export type SensorPoint = {
  sample: number
  value: number
  mean: number
  ucl: number
  lcl: number
  isAnomaly?: boolean
}

export type SensorStream = {
  key: SensorKey
  label: string
  unit: string
  description: string
  points: SensorPoint[]
}

export type ManufacturingLog = {
  time: string
  source: string
  message: string
}

export type GroundTruth = {
  anomalyType: string
  rootCause: string
  teachingFocus: string[]
}

export type Scenario = {
  id: string
  title: string
  summary: string
  line: string
  product: string
  objectives: string[]
  sensors: SensorStream[]
  logs: ManufacturingLog[]
  groundTruth: GroundTruth
}
