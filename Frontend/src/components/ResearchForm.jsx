import { useState } from 'react'

export function ResearchForm({ onSubmit, isSubmitting }) {
  const [topic, setTopic] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmed = topic.trim()
    if (!trimmed) return
    onSubmit(trimmed)
  }

  return (
    <form className="research-form" onSubmit={handleSubmit}>
      <label htmlFor="topic" className="sr-only">
        Research topic
      </label>
      <input
        id="topic"
        name="topic"
        type="text"
        value={topic}
        onChange={(event) => setTopic(event.target.value)}
        placeholder="e.g. Impact of AI on healthcare"
        autoComplete="off"
      />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Starting…' : 'Start Research'}
      </button>
    </form>
  )
}
