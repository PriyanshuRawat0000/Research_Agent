import React from 'react'

export function PanelCard({ title, children, className = '' }) {
  return (
    <section className={`panel panel-card ${className}`}>
      <div className="panel-header">
        <h3>{title}</h3>
      </div>
      <div className="panel-body">{children}</div>
    </section>
  )
}

export default PanelCard
