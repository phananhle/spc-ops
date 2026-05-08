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
import { getMockTutorResponse } from './services/tutor'
import type { ChatMessage } from './services/tutor'

const initialSensorKey: SensorKey = activeScenario.sensors[0].key

function App() {
  const [activeSensorKey, setActiveSensorKey] = useState<SensorKey>(initialSensorKey)
  const [draftMessage, setDraftMessage] = useState('')
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

  const handleSendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedMessage = draftMessage.trim()

    if (!trimmedMessage) {
      return
    }

    const learnerMessage: ChatMessage = {
      id: Date.now(),
      role: 'learner',
      text: trimmedMessage,
    }
    const tutorMessage: ChatMessage = {
      id: Date.now() + 1,
      role: 'tutor',
      text: getMockTutorResponse(trimmedMessage, activeScenario, activeSensorKey, chatMessages),
    }

    setChatMessages((messages) => [...messages, learnerMessage, tutorMessage])
    setDraftMessage('')
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
          />
        </div>
        <div className="grid-slot grid-slot-objectives">
          <ObjectivesPanel
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
