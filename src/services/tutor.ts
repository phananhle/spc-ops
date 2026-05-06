import type { Scenario, SensorKey } from '../data/types'

export type ChatMessage = {
  id: number
  role: 'learner' | 'tutor'
  text: string
}

const responseBank = [
  'Good observation. Before naming a cause, which chart feature tells you this is more than normal random noise?',
  'Look at the timing across sensors. Which stream starts drifting first, and which manufacturing log happened near that change?',
  'Try comparing the diameter trend with cooling bath temperature. What physical link could make those move together?',
  'You are close. How would you separate a material lot issue from a cooling process issue using the evidence shown here?',
]

export function getMockTutorResponse(
  message: string,
  scenario: Scenario,
  activeSensor: SensorKey,
  previousMessages: ChatMessage[],
) {
  const normalizedMessage = message.toLowerCase()

  if (normalizedMessage.includes('answer') || normalizedMessage.includes('summary')) {
    return `A concise expert summary would mention ${scenario.groundTruth.anomalyType.toLowerCase()} and connect it to ${scenario.groundTruth.rootCause.toLowerCase()} What evidence would you cite first if you had to justify that conclusion?`
  }

  if (normalizedMessage.includes('temperature') || normalizedMessage.includes('cool')) {
    return 'That is a useful direction. If cooling temperature rises while diameter drifts upward, what does that suggest about shrinkage after the sizing sleeve?'
  }

  if (normalizedMessage.includes('pressure')) {
    return 'Pressure is drifting too, but ask whether it leads or follows the dimensional issue. What would you expect pressure to do if material flow resistance changed?'
  }

  if (normalizedMessage.includes('diameter') || activeSensor === 'diameter') {
    return 'On the diameter chart, focus on the sequence before the limit is crossed. How many points keep moving upward, and why is that useful for early intervention?'
  }

  return responseBank[previousMessages.length % responseBank.length]
}
