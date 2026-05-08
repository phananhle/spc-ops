export type SensorKey =
  | 'pressure'
  | 'temperature'
  | 'diameter'
  | 'wallThickness'
  | 'coolantTemp'

export type SensorPoint = {
  sample: number
  time: string
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

export type TutorRung = {
  concept: string
  nudge: string
  hint: string
  reveal: string
}

export type SpcMisconception = {
  id: string
  label: string
  triggerCues: string[]
  correctiveHint: string
}

export type Scenario = {
  id: string
  title: string
  summary: string
  problemStatement: string
  line: string
  product: string
  objectives: string[]
  sensors: SensorStream[]
  logs: ManufacturingLog[]
  groundTruth: GroundTruth
  tutorPlan?: TutorRung[]
  misconceptions?: SpcMisconception[]
}
