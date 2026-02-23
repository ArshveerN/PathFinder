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
  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState('All')

  const filteredCourses = courses.filter((course) => {
    const code = (course['Course Code'] || '').toLowerCase()
    const name = (course.Name || '').toLowerCase()
    const searchLower = searchTerm.toLowerCase()

    const matchesSearch = code.includes(searchLower) || name.includes(searchLower)

    let matchesLevel = true
    if (levelFilter !== 'All') {
      const match = (course['Course Code'] || '').match(/^[a-zA-Z]+(\d)/)
      if (match) {
        const level = match[1] + '00' 
        matchesLevel = level === levelFilter
      } else {
        matchesLevel = false
      }
    }

    return matchesSearch && matchesLevel
  })

  return (
    <div className="bc-container">
      <div className="bc-header">
        <div className="bc-header-left">
          <button className="bc-back" onClick={onBack}>← Back</button>
          <h1 className="bc-title">All Courses</h1>
        </div>
        <span className="bc-count">Showing {filteredCourses.length} of {courses.length} courses</span>
      </div>

      <div className="bc-content">
        

        <div className="bc-controls">
          <input 
            type="text" 
            placeholder="Search by course code or name (e.g. CSC, Anthropology)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bc-search-input"
          />
          <select 
            value={levelFilter} 
            onChange={(e) => setLevelFilter(e.target.value)}
            className="bc-level-select"
          >
            <option value="All">All Levels</option>
            <option value="100">100 Level</option>
            <option value="200">200 Level</option>
            <option value="300">300 Level</option>
            <option value="400">400 Level</option>
          </select>
        </div>

        {loading && (
          <div className="bc-status">
            <div className="bc-spinner" />
            <p>Loading courses…</p>
          </div>
        )}

        {error && <div className="bc-error">⚠ {error}</div>}

        {!loading && !error && (
          <>
            {filteredCourses.length === 0 ? (
               <div className="bc-status">No courses found matching your criteria.</div>
            ) : (
              <div className="bc-grid">
                {filteredCourses.map((c, i) => (
                  <CourseCard key={c['Course Code'] || i} course={c} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default BrowseCoursesView