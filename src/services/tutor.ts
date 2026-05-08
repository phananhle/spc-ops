import type { Scenario, SensorKey, SensorStream } from '../data/types'

export type ChatMessage = {
  id: number
  role: 'learner' | 'tutor'
  text: string
}

const genericResponseBank = [
  'Good observation. Before naming a cause, which chart feature tells you this is more than normal random noise?',
  'Look at the timing across sensors. Which stream starts moving first, and which manufacturing log happened near that change?',
  'How would you separate a material issue from a process issue using only the evidence shown here?',
  'Which sensor is the symptom, and which is closer to the source?',
]

function findMentionedSensor(
  message: string,
  sensors: SensorStream[],
): SensorStream | undefined {
  const lower = message.toLowerCase()
  return sensors.find((sensor) => {
    if (lower.includes(sensor.key.toLowerCase())) {
      return true
    }
    return sensor.label
      .toLowerCase()
      .split(/\s+/)
      .some((word) => word.length > 3 && lower.includes(word))
  })
}

export function getMockTutorResponse(
  message: string,
  scenario: Scenario,
  activeSensor: SensorKey,
  previousMessages: ChatMessage[],
) {
  const lower = message.toLowerCase()

  if (lower.includes('answer') || lower.includes('summary')) {
    return `A concise expert summary would mention ${scenario.groundTruth.anomalyType.toLowerCase()} and connect it to ${scenario.groundTruth.rootCause.toLowerCase()} What evidence would you cite first?`
  }

  const mentioned = findMentionedSensor(message, scenario.sensors)
  if (mentioned) {
    if (mentioned.key === activeSensor) {
      return `On the ${mentioned.label} chart, focus on the sequence before any limit is crossed. What does the pattern tell you — is this stream leading the others or lagging behind them?`
    }
    const activeLabel =
      scenario.sensors.find((sensor) => sensor.key === activeSensor)?.label ??
      'the current chart'
    return `${mentioned.label} is worth a closer look. Switch to that tab and compare its timing against ${activeLabel}. Which one moves first?`
  }

  const teachingPrompts = scenario.groundTruth.teachingFocus.map(
    (focus) =>
      `Consider this lens: ${focus.toLowerCase().replace(/\.$/, '')}. What does that suggest you check next?`,
  )
  const pool = [...teachingPrompts, ...genericResponseBank]
  return pool[previousMessages.length % pool.length]
}
