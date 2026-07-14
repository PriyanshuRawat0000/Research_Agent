import { useEffect, useState } from 'react'
import { getResearchStatus } from '../services/researchService'

export function useResearchJob(jobId, status) {
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!jobId || status === 'completed' || status === 'failed') {
      return
    }

    let intervalId
    const poll = async () => {
      try {
        setLoading(true)
        const data = await getResearchStatus(jobId)
        setJob(data)
        setError('')
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    poll()
    intervalId = window.setInterval(poll, 2000)

    return () => window.clearInterval(intervalId)
  }, [jobId, status])

  return { job, loading, error }
}
