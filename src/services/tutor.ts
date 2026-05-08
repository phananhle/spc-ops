import Anthropic from '@anthropic-ai/sdk'
import type { Scenario, SensorKey } from '../data/types'
import { buildSystemPrompt, type TutorMode } from './socraticPrompt'

export type ChatMessage = {
  id: number
  role: 'learner' | 'tutor'
  text: string
  mode?: TutorMode
}

export type TutorResponse = {
  tutorMessage: string
  scratchpad: string
  objectivesMet: number[]
  mode: TutorMode
}

const MODEL_ID = 'claude-haiku-4-5-20251001'
const MAX_TOKENS = 1024

const SCRATCHPAD_PATTERN = /<scratchpad>([\s\S]*?)<\/scratchpad>/i
const OBJECTIVES_PATTERN = /<objectives_met>\s*(\[[^\]]*\])\s*<\/objectives_met>/i

const parseObjectives = (raw: string): number[] => {
  const match = raw.match(OBJECTIVES_PATTERN)
  if (!match) return []
  try {
    const parsed = JSON.parse(match[1])
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (n): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0,
    )
  } catch {
    return []
  }
}

const splitTutorResponse = (
  raw: string,
): { scratchpad: string; objectivesMet: number[]; userFacing: string } => {
  const scratchMatch = raw.match(SCRATCHPAD_PATTERN)
  const scratchpad = scratchMatch ? scratchMatch[1].trim() : ''
  const objectivesMet = parseObjectives(raw)
  const userFacing = raw
    .replace(SCRATCHPAD_PATTERN, '')
    .replace(OBJECTIVES_PATTERN, '')
    .trim()
  return { scratchpad, objectivesMet, userFacing }
}

const toAnthropicMessages = (
  history: ChatMessage[],
  newLearnerMessage: string,
): Array<{ role: 'user' | 'assistant'; content: string }> => {
  const mapped = history.map((m) => ({
    role: m.role === 'learner' ? ('user' as const) : ('assistant' as const),
    content: m.text,
  }))

  while (mapped.length > 0 && mapped[0].role === 'assistant') {
    mapped.shift()
  }

  const collapsed: Array<{ role: 'user' | 'assistant'; content: string }> = []
  for (const turn of mapped) {
    const last = collapsed[collapsed.length - 1]
    if (last && last.role === turn.role) {
      last.content = `${last.content}\n\n${turn.content}`
    } else {
      collapsed.push(turn)
    }
  }

  const last = collapsed[collapsed.length - 1]
  if (last && last.role === 'user') {
    last.content = `${last.content}\n\n${newLearnerMessage}`
  } else {
    collapsed.push({ role: 'user', content: newLearnerMessage })
  }

  return collapsed
}

const getApiKey = (): string => {
  const key = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!key) {
    throw new Error(
      'VITE_ANTHROPIC_API_KEY is not set. Copy .env.example to .env.local and fill in your Anthropic API key.',
    )
  }
  return key
}

export async function getTutorResponse(
  message: string,
  scenario: Scenario,
  activeSensorKey: SensorKey,
  history: ChatMessage[],
  mode: TutorMode,
): Promise<TutorResponse> {
  const client = new Anthropic({
    apiKey: getApiKey(),
    dangerouslyAllowBrowser: true,
  })

  const systemPrompt = buildSystemPrompt(scenario, activeSensorKey, mode)
  const messages = toAnthropicMessages(history, message)

  const response = await client.messages.create({
    model: MODEL_ID,
    max_tokens: MAX_TOKENS,
    // Omit `system` entirely in default mode so the LLM gets no scaffolding at all.
    ...(systemPrompt.length > 0 ? { system: systemPrompt } : {}),
    messages,
  })

  const rawText = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim()

  if (mode === 'direct' || mode === 'default') {
    // Neither Direct nor Default mode emits a scratchpad or objectives tag.
    return { tutorMessage: rawText, scratchpad: '', objectivesMet: [], mode }
  }

  const { scratchpad, objectivesMet, userFacing } = splitTutorResponse(rawText)
  return {
    tutorMessage: userFacing.length > 0 ? userFacing : rawText,
    scratchpad,
    objectivesMet,
    mode,
  }
}
