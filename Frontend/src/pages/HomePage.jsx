import { useMemo, useState } from 'react'
import { ResearchForm } from '../components/ResearchForm'
import { ProgressPanel } from '../components/ProgressPanel'
import { ReportCard } from '../components/ReportCard'
import { useResearchJob } from '../hooks/useResearchJob'
import { startResearch } from '../services/researchService'

export function HomePage() {
  const [topic, setTopic] = useState('')
  const [jobId, setJobId] = useState('')
  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [message, setMessage] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { job, loading: pollingLoading, error: pollingError } = useResearchJob(jobId, status)

  const handleSubmit = async (enteredTopic) => {
    setTopic(enteredTopic)
    setError('')
    setResult(null)
    setIsSubmitting(true)

    try {
      const data = await startResearch(enteredTopic)
      setJobId(data.job_id)
      setStatus(data.status)
      setProgress(0)
      setCurrentStep('queued')
      setMessage(data.message)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  useMemo(() => {
    if (!job) return

    setStatus(job.status || 'running')
    setProgress(job.progress || 0)
    setCurrentStep(job.current_step || '')
    setMessage(job.message || '')
    setResult(job)
  }, [job])

  return (
    <main className="page-shell">
      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">AI-powered research workspace</p>
          <h1>Turn complex questions into clear, structured reports.</h1>
          <p className="hero-text">
            Start a new research session, monitor the agents in real time, and review the generated findings in one polished workspace.
          </p>
        </div>

        <div className="hero-panel">
          <ResearchForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />

          {error && <p className="error-text">{error}</p>}
          {pollingError && <p className="error-text">{pollingError}</p>}

          <ProgressPanel
            status={status}
            currentStep={currentStep}
            progress={progress}
            message={message}
          />
        </div>
      </section>

      {(result || pollingLoading) && <ReportCard result={result} />}
    </main>
  )
}
