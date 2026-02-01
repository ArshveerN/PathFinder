import React from 'react'
import jobPaths from '../data/jobPaths'

function CareerRoadmap({ career, onBack }) {
  const courses = jobPaths[career] || []

  return (
    <div className="career-roadmap" style={{ padding: 24 }}>
      <div className="roadmap-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack}>← Back</button>
        <h1 style={{ margin: 0 }}>{career} Roadmap</h1>
      </div>

      <div className="roadmap-content" style={{ marginTop: 18 }}>
        <p>Simple roadmap of courses to complete:</p>
        <ol>
          {courses.map((code, i) => (
            <li key={i}>{code}</li>
          ))}
        </ol>
      </div>
    </div>
  )
}

export default CareerRoadmap
