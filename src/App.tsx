import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import './App.css'
import { demoScenario } from './data/demoScenario'
import type { SensorKey } from './data/types'
import { getMockTutorResponse } from './services/tutor'
import type { ChatMessage } from './services/tutor'

function App() {
  const [activeSensorKey, setActiveSensorKey] = useState<SensorKey>('diameter')
  const [draftMessage, setDraftMessage] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: 'tutor',
      text: 'Start by describing what you see in the chart. Is the process stable, shifting, or trending?',
    },
  ])

  const activeSensor = demoScenario.sensors.find((sensor) => sensor.key === activeSensorKey)

  const anomalyWindow = useMemo(() => {
    const anomalyPoints = activeSensor?.points.filter((point) => point.isAnomaly) ?? []

    if (anomalyPoints.length === 0) {
      return null
    }

    return {
      start: anomalyPoints[0].sample,
      end: anomalyPoints[anomalyPoints.length - 1].sample,
    }
  }, [activeSensor])

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
      text: getMockTutorResponse(
        trimmedMessage,
        demoScenario,
        activeSensorKey,
        chatMessages,
      ),
    }

    setChatMessages((messages) => [...messages, learnerMessage, tutorMessage])
    setDraftMessage('')
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">SPC-Ops training demo</p>
          <h1>{demoScenario.title}</h1>
          <p>{demoScenario.summary}</p>
        </div>
        <div className="scenario-card">
          <span>{demoScenario.line}</span>
          <strong>{demoScenario.product}</strong>
        </div>
      </header>

      <section className="dashboard-grid" aria-label="SPC training workspace">
        <div className="analysis-column">
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
            {demoScenario.sensors.map((sensor) => (
              <button
                className={sensor.key === activeSensorKey ? 'active' : ''}
                key={sensor.key}
                onClick={() => setActiveSensorKey(sensor.key)}
                type="button"
              >
                {sensor.label}
              </button>
            ))}
          </div>

          <div className="chart-frame">
            <ResponsiveContainer height="100%" width="100%">
              <LineChart data={activeSensor.points} margin={{ bottom: 12, left: 4, right: 18, top: 12 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="sample"
                  label={{ value: 'Sample group', position: 'insideBottom', offset: -8 }}
                />
                <YAxis
                  domain={['dataMin - 0.1', 'dataMax + 0.1']}
                  label={{ value: activeSensor.unit, angle: -90, position: 'insideLeft' }}
                />
                <Tooltip />
                <Legend verticalAlign="top" />
                {anomalyWindow ? (
                  <ReferenceArea
                    fill="#f59e0b"
                    fillOpacity={0.16}
                    x1={anomalyWindow.start}
                    x2={anomalyWindow.end}
                  />
                ) : null}
                <ReferenceLine y={activeSensor.points[0].ucl} label="UCL" stroke="#dc2626" />
                <ReferenceLine y={activeSensor.points[0].mean} label="Mean" stroke="#64748b" strokeDasharray="5 5" />
                <ReferenceLine y={activeSensor.points[0].lcl} label="LCL" stroke="#dc2626" />
                <Line
                  activeDot={{ r: 7 }}
                  dataKey="value"
                  dot={{ r: 3 }}
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
              ? `Samples ${anomalyWindow.start}-${anomalyWindow.end} show the training signal.`
              : 'No abnormal region marked for this stream.'}
          </div>
          </div>

          <div className="below-chart-grid">
            <section className="context-panel panel">
              <div className="panel-header">
                <div>
                  <h2>Manufacturing logs</h2>
                </div>
              </div>
              <div className="log-list">
                {demoScenario.logs.map((log) => (
                  <article className="log-card" key={`${log.time}-${log.source}`}>
                    <div>
                      <span>{log.time}</span>
                      <strong>{log.source}</strong>
                    </div>
                    <p>{log.message}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="objectives-panel panel">
              <p className="eyebrow">Problems to debug</p>
              <h2>Objectives</h2>
              <ol className="objective-list">
                {demoScenario.objectives.map((objective) => (
                  <li key={objective}>{objective}</li>
                ))}
              </ol>
            </section>
          </div>
        </div>

        <aside className="chat-panel panel">
          <div className="tutor-hero">
            <div>
              <p className="eyebrow">Active coaching</p>
              <h2>Socratic tutor</h2>
            </div>
            <p>Test your reasoning against the chart and logs. The tutor will nudge instead of giving the answer away.</p>
          </div>
          <div className="chat-history" aria-live="polite">
            {chatMessages.map((message) => (
              <div className={`chat-message ${message.role}`} key={message.id}>
                <span>{message.role === 'tutor' ? 'Tutor' : 'You'}</span>
                <p>{message.text}</p>
              </div>
            ))}
          </div>
          <form className="chat-form" onSubmit={handleSendMessage}>
            <input
              aria-label="Message the tutor"
              onChange={(event) => setDraftMessage(event.target.value)}
              placeholder="Ask for a hint..."
              value={draftMessage}
            />
            <button type="submit">Send</button>
          </form>
        </aside>
      </section>
    </main>
  )
}

export default App
