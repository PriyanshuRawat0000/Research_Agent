import { useState } from 'react'
import ReportViewer from './ReportViewer'
import PanelCard from './PanelCard'

export function ReportCard({ result }) {
  if (!result) return null

  const report = result.report || result.message || 'No report available yet.'
  const feedback = result.feedback || ''
  const searchResults = result.search_results || ''
  const scrapedContent = result.scrapped_content || ''

  const normalizeToString = (content) => {
    if (content == null) return ''
    if (typeof content === 'string') return content
    const safeStringify = (obj) => {
      const seen = new Set()
      try {
        return JSON.stringify(obj, (k, v) => {
          if (v && typeof v === 'object') {
            if (seen.has(v)) return '[Circular]'
            seen.add(v)
          }
          return v
        }, 2)
      } catch (e) {
        try {
          // fallback to simple inspection
          return Object.prototype.toString.call(obj) === '[object Object]'
            ? Object.entries(obj).map(([k, v]) => `${k}: ${String(v)}`).join(', ')
            : String(obj)
        } catch (_) {
          return String(obj)
        }
      }
    }

    if (Array.isArray(content)) {
      // If array of objects, try to produce readable bullets using common fields
      const items = content.map((item) => {
        if (item == null) return ''
        if (typeof item === 'string') return item
        if (typeof item === 'object') {
          // common fields for search hits
          const title = item.title || item.name || item.headline || item.text || item.summary
          const url = item.url || item.link || item.href || item.source
          if (title || url) {
            return `${title ? title : url}${title && url ? ' — ' + url : ''}`
          }
          if ('content' in item) return normalizeToString(item.content)
          if ('text' in item) return item.text
          return safeStringify(item)
        }
        return String(item)
      })
      // format as markdown list for ReportViewer to render nicely
      return items.filter(Boolean).map((it) => `- ${it}`).join('\n')
    }
    if (typeof content === 'object') {
      if ('text' in content) return content.text
      if ('content' in content) return normalizeToString(content.content)
      return JSON.stringify(content)
    }
    return String(content)
  }

  const splitSections = (text) => {
    const src = normalizeToString(text)
    const sections = {}
    const headings = ['Introduction', 'Key Findings', 'Conclusion', 'Sources']
    // Try to split by known headings
    const headingRegex = new RegExp('(^(?:' + headings.join('|') + ')[:\s]*)', 'mi')
    if (headingRegex.test(src)) {
      // split into lines and detect headings
      const lines = src.split(/\r?\n/)
      let current = 'Overview'
      sections[current] = []
      for (const line of lines) {
        const h = headings.find((hh) => new RegExp('^' + hh + '[:\s]*$', 'i').test(line.trim()))
        if (h) {
          current = h
          sections[current] = []
          continue
        }
        sections[current].push(line)
      }
      // join lines
      Object.keys(sections).forEach((k) => {
        sections[k] = sections[k].join('\n').trim()
      })
      return sections
    }
    return { Overview: src }
  }

  const renderParagraphs = (text) =>
    normalizeToString(text)
      .split('\n\n')
      .map((para, i) => (
        <p key={i}>{para}</p>
      ))

  const reportSections = splitSections(report)
  const [copied, setCopied] = useState(false)

  // normalize sub-panel contents in case they are arrays/objects
  const normalizedFeedback = normalizeToString(feedback)
  const normalizedSearchResults = normalizeToString(searchResults)
  const normalizedScrapedContent = normalizeToString(scrapedContent)

  const getCombinedReportText = () => {
    return Object.entries(reportSections)
      .map(([title, body]) => (title === 'Overview' ? body : `${title}\n\n${body}`))
      .filter(Boolean)
      .join('\n\n')
  }

  const copyReport = async () => {
    try {
      const txt = getCombinedReportText()
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(txt)
      } else {
        // fallback
        const el = document.createElement('textarea')
        el.value = txt
        document.body.appendChild(el)
        el.select()
        document.execCommand('copy')
        document.body.removeChild(el)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Copy failed', err)
    }
  }

  return (
    <div className="report-grid">
      <section className="panel main-report">
        <div className="panel-header">
          <h2>Final Report</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="copy-btn" onClick={copyReport}>{copied ? 'Copied' : 'Copy Report'}</button>
          </div>
        </div>

        <div className="report-content">
          {Object.entries(reportSections).map(([title, body]) => (
            <article className="report-block" key={title}>
              <h4>{title}</h4>
              {body ? <ReportViewer>{body}</ReportViewer> : <p className="muted">No content</p>}
            </article>
          ))}
        </div>
      </section>
      {normalizedFeedback && (
        <PanelCard title="Critic Review" className="feedback-panel">
          <ReportViewer>{normalizedFeedback}</ReportViewer>
        </PanelCard>
      )}

      {normalizedSearchResults && (
        <PanelCard title="Search Results" className="search-panel">
          <ReportViewer>{normalizedSearchResults}</ReportViewer>
        </PanelCard>
      )}

      {normalizedScrapedContent && (
        <PanelCard title="Scraped Content" className="scraped-panel">
          <ReportViewer>{normalizedScrapedContent}</ReportViewer>
        </PanelCard>
      )}
    </div>
  )
}
