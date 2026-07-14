const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export async function startResearch(topic) {
  const response = await fetch(`${API_BASE_URL}/research`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to start research')
  }

  return data
}

export async function getResearchStatus(jobId) {
  const response = await fetch(`${API_BASE_URL}/research/${jobId}`)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to fetch research status')
  }

  return data
}
