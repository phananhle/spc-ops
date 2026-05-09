import { useEffect, useRef } from 'react'
import type { FormEvent } from 'react'
import Markdown from 'markdown-to-jsx'
import type { ChatMessage } from '../services/tutor'
import type { TutorMode } from '../services/socraticPrompt'
import './TutorPanel.css'

type Props = {
  messages: ChatMessage[]
  draftMessage: string
  onDraftChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  mode: TutorMode
  onModeChange: (mode: TutorMode) => void
  isThinking: boolean
  onCopyTranscript?: () => void
}

export function TutorPanel({
  messages,
  draftMessage,
  onDraftChange,
  onSubmit,
  mode,
  onModeChange,
  isThinking,
  onCopyTranscript,
}: Props) {
  const historyRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const node = historyRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [messages, isThinking])

  return (
    <aside className="tutor-panel panel">
      <div className="tutor-hero">
        <div className="tutor-hero-row">
          <div>
            <p className="eyebrow">Active coaching</p>
            <h2>Socratic tutor</h2>
          </div>
          <div className="mode-toggle" role="radiogroup" aria-label="Tutor mode">
            <button
              type="button"
              role="radio"
              aria-checked={mode === 'socratic'}
              className={mode === 'socratic' ? 'active' : ''}
              onClick={() => onModeChange('socratic')}
            >
              Socratic
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={mode === 'direct'}
              className={mode === 'direct' ? 'active' : ''}
              onClick={() => onModeChange('direct')}
            >
              Direct
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={mode === 'default'}
              className={mode === 'default' ? 'active' : ''}
              onClick={() => onModeChange('default')}
              title="No system prompt — out-of-the-box LLM"
            >
              Default
            </button>
          </div>
        </div>
      </div>
      <div className="chat-history" aria-live="polite" ref={historyRef}>
        {messages.map((message) => (
          <div className={`chat-message ${message.role}`} key={message.id}>
            <span>
              {message.role === 'tutor' ? 'Tutor' : 'You'}
              {message.role === 'tutor' && message.mode ? (
                <em className={`mode-badge mode-badge-${message.mode}`}>{message.mode}</em>
              ) : null}
            </span>
            <div className="message-body">
              {message.role === 'tutor' ? (
                <Markdown options={{ forceWrapper: true, wrapper: 'div' }}>
                  {message.text}
                </Markdown>
              ) : (
                <p>{message.text}</p>
              )}
            </div>
          </div>
        ))}
        {isThinking ? (
          <div className="chat-message tutor thinking">
            <span>Tutor</span>
            <div className="message-body"><p><em>Thinking…</em></p></div>
          </div>
        ) : null}
      </div>
      <form className="chat-form" onSubmit={onSubmit}>
        <input
          aria-label="Message the tutor"
          disabled={isThinking}
          onChange={(event) => onDraftChange(event.target.value)}
          placeholder="Ask for a hint or test your reasoning..."
          value={draftMessage}
        />
        <button type="submit" disabled={isThinking}>Send</button>
      </form>
      {onCopyTranscript ? (
        <button type="button" className="copy-transcript" onClick={onCopyTranscript}>
          Copy transcript
        </button>
      ) : null}
    </aside>
  )
}
