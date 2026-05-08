import type { FormEvent } from 'react'
import type { ChatMessage } from '../services/tutor'
import './TutorPanel.css'

type Props = {
  messages: ChatMessage[]
  draftMessage: string
  onDraftChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function TutorPanel({ messages, draftMessage, onDraftChange, onSubmit }: Props) {
  return (
    <aside className="tutor-panel panel">
      <div className="tutor-hero">
        <p className="eyebrow">Active coaching</p>
        <h2>Socratic tutor</h2>
      </div>
      <div className="chat-history" aria-live="polite">
        {messages.map((message) => (
          <div className={`chat-message ${message.role}`} key={message.id}>
            <span>{message.role === 'tutor' ? 'Tutor' : 'You'}</span>
            <p>{message.text}</p>
          </div>
        ))}
      </div>
      <form className="chat-form" onSubmit={onSubmit}>
        <input
          aria-label="Message the tutor"
          onChange={(event) => onDraftChange(event.target.value)}
          placeholder="Ask for a hint or test your reasoning..."
          value={draftMessage}
        />
        <button type="submit">Send</button>
      </form>
    </aside>
  )
}
