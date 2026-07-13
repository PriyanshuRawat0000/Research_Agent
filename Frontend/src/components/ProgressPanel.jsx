export function ProgressPanel({ status, currentStep, progress, message }) {
  const normalizedStatus = status || 'idle'

  return (
    <section className="panel progress-panel" aria-live="polite">
      <div className="panel-header">
        <h2>Research Status</h2>
        <span className={`status-pill ${normalizedStatus}`}>{normalizedStatus}</span>
      </div>

      <div className="progress-meta">
        <p><strong>Current step:</strong> {currentStep || 'Waiting to begin'}</p>
        <p><strong>Progress:</strong> {progress}%</p>
      </div>

      <div className="progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}>
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {message && <p className="panel-message">{message}</p>}
    </section>
  )
}
