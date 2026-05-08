import './ObjectivesPanel.css'

type Props = {
  problemStatement: string
  objectives: string[]
  completed: Set<number>
  onToggle: (index: number) => void
}

export function ObjectivesPanel({ problemStatement, objectives, completed, onToggle }: Props) {
  const completedCount = completed.size
  const total = objectives.length
  const pct = total === 0 ? 0 : Math.round((completedCount / total) * 100)

  return (
    <section className="objectives-panel panel">
      <div className="problem-block">
        <p className="eyebrow">Problem</p>
        <p className="problem-text">{problemStatement}</p>
      </div>

      <div className="progress-row">
        <p className="eyebrow">Understanding</p>
        <span className="progress-pct">{pct}%</span>
      </div>
      <div className="progress-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>

      <p className="eyebrow objectives-eyebrow">Objectives</p>
      <ul className="objective-list">
        {objectives.map((objective, index) => {
          const isDone = completed.has(index)
          return (
            <li key={objective}>
              <button
                type="button"
                className={`objective-row ${isDone ? 'done' : ''}`}
                onClick={() => onToggle(index)}
                aria-pressed={isDone}
              >
                <span className="checkbox" aria-hidden="true">
                  {isDone ? '✓' : ''}
                </span>
                <span className="objective-text">{objective}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
