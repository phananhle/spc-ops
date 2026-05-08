import { useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import { AppHeader } from './components/AppHeader'
import { ChartPanel } from './components/ChartPanel'
import { LogsPanel } from './components/LogsPanel'
import { ObjectivesPanel } from './components/ObjectivesPanel'
import { TutorPanel } from './components/TutorPanel'
import { activeScenario } from './data/scenarios'
import type { SensorKey } from './data/types'
import { getTutorResponse } from './services/tutor'
import type { ChatMessage } from './services/tutor'
import type { TutorMode } from './services/socraticPrompt'

const initialSensorKey: SensorKey = activeScenario.sensors[0].key

const formatTranscript = (messages: ChatMessage[]): string => {
  const lines = [
    `# Transcript — ${activeScenario.id} — ${new Date().toISOString()}`,
    '',
  ]
  for (const message of messages) {
    const speaker =
      message.role === 'tutor'
        ? `**Tutor${message.mode ? ` (${message.mode})` : ''}:**`
        : '**You:**'
    lines.push(speaker, message.text, '')
  }
  return lines.join('\n')
}

function App() {
  const [activeSensorKey, setActiveSensorKey] = useState<SensorKey>(initialSensorKey)
  const [draftMessage, setDraftMessage] = useState('')
  const [mode, setMode] = useState<TutorMode>('socratic')
  const [isThinking, setIsThinking] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: 'tutor',
      text: 'Start by describing what you see in the chart. Is the process stable, shifting, or trending?',
    },
  ])
  const [completedObjectives, setCompletedObjectives] = useState<Set<number>>(new Set())

  const activeSensor = activeScenario.sensors.find((sensor) => sensor.key === activeSensorKey)

  if (!activeSensor) {
    return null
  }

  const handleSendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedMessage = draftMessage.trim()
    if (!trimmedMessage || isThinking) {
      return
    }

    const learnerMessage: ChatMessage = {
      id: Date.now(),
      role: 'learner',
      text: trimmedMessage,
    }
    const historyForCall = chatMessages
    setChatMessages((messages) => [...messages, learnerMessage])
    setDraftMessage('')
    setIsThinking(true)

    try {
      const response = await getTutorResponse(
        trimmedMessage,
        activeScenario,
        activeSensorKey,
        historyForCall,
        mode,
      )
      const tutorMessage: ChatMessage = {
        id: Date.now() + 1,
        role: 'tutor',
        text: response.tutorMessage,
        mode: response.mode,
      }
      setChatMessages((messages) => [...messages, tutorMessage])

      // The Socratic tutor reports cumulative objective mastery via <objectives_met>.
      // Merge into the existing Set — once checked, only the user can uncheck (avoids
      // flapping if the tutor is uncertain on a later turn).
      if (response.objectivesMet.length > 0) {
        setCompletedObjectives((prev) => {
          const next = new Set(prev)
          for (const idx of response.objectivesMet) {
            if (idx < activeScenario.objectives.length) next.add(idx)
          }
          return next
        })
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unknown error'
      const tutorMessage: ChatMessage = {
        id: Date.now() + 1,
        role: 'tutor',
        text: `Tutor unavailable — ${detail}`,
        mode,
      }
      setChatMessages((messages) => [...messages, tutorMessage])
    } finally {
      setIsThinking(false)
    }
  }

  const handleObjectiveToggle = (index: number) => {
    setCompletedObjectives((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const handleCopyTranscript = async () => {
    const text = formatTranscript(chatMessages)
    await navigator.clipboard.writeText(text)
  }

  return (
    <main className="app-shell">
      <AppHeader />

      <section className="dashboard-grid" aria-label="SPC training workspace">
        <div className="grid-slot grid-slot-chart">
          <ChartPanel
            scenario={activeScenario}
            activeSensor={activeSensor}
            activeSensorKey={activeSensorKey}
            onSensorChange={setActiveSensorKey}
          />
        </div>
        <div className="grid-slot grid-slot-logs">
          <LogsPanel logs={activeScenario.logs} />
        </div>
        <div className="grid-slot grid-slot-tutor">
          <TutorPanel
            messages={chatMessages}
            draftMessage={draftMessage}
            onDraftChange={setDraftMessage}
            onSubmit={handleSendMessage}
            mode={mode}
            onModeChange={setMode}
            isThinking={isThinking}
            onCopyTranscript={import.meta.env.DEV ? handleCopyTranscript : undefined}
          />
        </div>
        <div className="grid-slot grid-slot-objectives">
          <ObjectivesPanel
            scenarioId={activeScenario.id}
            problemStatement={activeScenario.problemStatement}
            objectives={activeScenario.objectives}
            completed={completedObjectives}
            onToggle={handleObjectiveToggle}
          />
        </div>
      </section>
    </main>
  )
}

export default App
