import { useState } from 'react'
import './BrowseCoursesView.css'

const DIST_COLORS = {
  'Science': { bg: '#ecfdf5', text: '#065f46' },
  'Social Science': { bg: '#eff6ff', text: '#1e40af' },
  'Humanities': { bg: '#fef2f2', text: '#991b1b' },
}

function CourseCard({ course }) {
  const [expanded, setExpanded] = useState(false)
  const dist = DIST_COLORS[course.Distribution] || { bg: '#f3f4f6', text: '#4b5563' }

  return (
    <div className="bc-card" onClick={() => setExpanded(!expanded)}>
      <div className="bc-card-row">
        <span className="bc-code">{course['Course Code']}</span>
        <span className="bc-badge" style={{ background: dist.bg, color: dist.text }}>
          {course.Distribution || 'N/A'}
        </span>
      </div>

      <h3 className="bc-name">{course.Name}</h3>

      <p className="bc-desc">
        {expanded
          ? course.Description
          : course.Description?.length > 160
            ? course.Description.slice(0, 160) + '…'
            : course.Description}
      </p>

      <div className="bc-meta">
        {course.Hours && <span className="bc-chip">{course.Hours}</span>}
        {course['Delivery Mode'] && <span className="bc-chip">{course['Delivery Mode']}</span>}
      </div>

      {expanded && (
        <div className="bc-details">
          {course.Prerequisites && (
            <div className="bc-detail"><span className="bc-detail-label">Prerequisites</span> {course.Prerequisites}</div>
          )}
          {course.Corequisites && (
            <div className="bc-detail"><span className="bc-detail-label">Corequisites</span> {course.Corequisites}</div>
          )}
          {course.Exclusions && (
            <div className="bc-detail"><span className="bc-detail-label">Exclusions</span> {course.Exclusions}</div>
          )}
          {course.Recommended_prep && (
            <div className="bc-detail"><span className="bc-detail-label">Recommended Prep</span> {course.Recommended_prep}</div>
          )}
        </div>
      )}

      <span className="bc-toggle">
        {expanded ? 'Show less ▲' : 'Show more ▼'}
      </span>
    </div>
  )
}

function BrowseCoursesView({ courses, loading, error, onBack }) {
  return (
    <div className="bc-container">
      <div className="bc-header">
        <div className="bc-header-left">
          <button className="bc-back" onClick={onBack}>← Back</button>
          <h1 className="bc-title">All Courses</h1>
        </div>
        <span className="bc-count">{courses.length} courses</span>
      </div>

      <div className="bc-content">
        {loading && (
          <div className="bc-status">
            <div className="bc-spinner" />
            <p>Loading courses…</p>
          </div>
        )}

        {error && <div className="bc-error">⚠ {error}</div>}

        {!loading && !error && (
          <div className="bc-grid">
            {courses.map((c, i) => (
              <CourseCard key={c['Course Code'] || i} course={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default BrowseCoursesView