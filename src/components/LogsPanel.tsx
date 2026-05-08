import type { ManufacturingLog } from '../data/types'
import './LogsPanel.css'

type Props = {
  logs: ManufacturingLog[]
}

export function LogsPanel({ logs }: Props) {
  return (
    <section className="logs-panel panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Shop floor</p>
          <h2>Manufacturing logs</h2>
        </div>
      </div>
      <div className="log-list">
        {logs.map((log) => (
          <article className="log-card" key={`${log.time}-${log.source}`}>
            <span className="log-time">{log.time}</span>
            <strong className="log-source">{log.source}</strong>
            <p className="log-message">{log.message}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
