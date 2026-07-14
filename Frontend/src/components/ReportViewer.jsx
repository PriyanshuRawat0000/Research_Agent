import React from 'react'
import ReactMarkdown from 'react-markdown'

const components = {
  h1: ({ node, ...props }) => <h1 className="rv-h1" {...props} />,
  h2: ({ node, ...props }) => <h2 className="rv-h2" {...props} />,
  h3: ({ node, ...props }) => <h3 className="rv-h3" {...props} />,
  h4: ({ node, ...props }) => <h4 className="rv-h4" {...props} />,
  h5: ({ node, ...props }) => <h5 className="rv-h5" {...props} />,
  h6: ({ node, ...props }) => <h6 className="rv-h6" {...props} />,
  code: ({ node, inline, className, children, ...props }) => {
    if (inline) {
      return <code className="rv-inline" {...props}>{children}</code>
    }

    return (
      <pre className="rv-code">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    )
  },
  a: ({ node, ...props }) => <a {...props} target="_blank" rel="noreferrer" />,
  ul: ({ node, ...props }) => <ul className="rv-list" {...props} />,
  ol: ({ node, ...props }) => <ol className="rv-list" {...props} />,
  hr: ({ node, ...props }) => <hr className="rv-hr" {...props} />,
}

export function ReportViewer({ children }) {
  return (
    <div className="report-viewer">
      <ReactMarkdown skipHtml components={components}>
        {children ?? ''}
      </ReactMarkdown>
    </div>
  )
}

export default ReportViewer
