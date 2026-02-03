import './CareerPaths.css'

function BrowseCoursesView({ courses, loading, error, onBack }) {
  return (
    <div className="career-paths-container">
      <div className="career-paths-header">
        <h1>All Courses</h1>
        <div className="header-tabs">
          <button className="tab active" onClick={onBack}>Back</button>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {loading && <div>Loading courses...</div>}
        {error && <div style={{ color: 'red' }}>Error: {error}</div>}

        {!loading && !error && (
          <div>
            <p>Found {courses.length} courses.</p>
            <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
              {courses.map((c, i) => (
                <div key={i} style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                  <pre style={{ margin: 0 }}>{JSON.stringify(c, null, 2)}</pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BrowseCoursesView
