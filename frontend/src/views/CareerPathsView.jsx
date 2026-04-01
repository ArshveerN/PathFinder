import './CareerPaths.css'

function CareerPathsView({
  savedPaths,
  showExplore,
  editMode,
  loading,
  allCareers,
  onBack,
  onOpenRoadmap,
  onAddPath,
  onRemovePath,
  onToggleExplore,
  onCloseExplore,
  onToggleEditMode,
}) {
  return (
    <div className="career-paths-container">
      <div className="career-paths-header">
        <div className="header-left">
          <button className="back-btn" onClick={onBack}>← Back</button>
          <h1>CAREER PATHS</h1>
        </div>
        {savedPaths.length > 0 && (
          <button
            className={`cp-edit-btn ${editMode ? 'cp-edit-btn-active' : ''}`}
            onClick={onToggleEditMode}
          >
            {editMode ? 'Done' : 'Edit'}
          </button>
        )}
      </div>

      <div className="career-paths-content">
        <h2>Saved Paths:</h2>

        {loading && <p className="cp-loading">Loading your paths...</p>}

        {!loading && savedPaths.length === 0 && (
          <p className="cp-empty">No saved paths yet. Explore paths below to add one.</p>
        )}

        <div className="saved-paths-grid">
          {savedPaths.map((path, index) => (
            <div key={index} className={`cp-card-wrap ${editMode ? 'cp-card-wrap-edit' : ''}`}>
              <button
                className="career-card career-tab"
                onClick={() => !editMode && onOpenRoadmap(path)}
                style={{ cursor: editMode ? 'default' : 'pointer' }}
              >
                {path}
              </button>
              {editMode && (
                <button
                  className="cp-remove-btn"
                  onClick={() => onRemovePath(path)}
                  aria-label={`Remove ${path}`}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          className="explore-button"
          onClick={onToggleExplore}
        >
          Explore Paths
        </button>

        {showExplore && (
          <div className="explore-modal">
            <div className="explore-content">
              <h3>Select a Career Path</h3>
              <div className="career-list">
                {allCareers.map((career, index) => (
                  <button
                    key={index}
                    className={`career-list-item ${savedPaths.includes(career) ? 'career-list-item-saved' : ''}`}
                    onClick={() => onAddPath(career)}
                    disabled={savedPaths.includes(career)}
                  >
                    {career}
                    {savedPaths.includes(career) && <span className="cp-saved-badge">Saved</span>}
                  </button>
                ))}
              </div>
              <button
                className="close-button"
                onClick={onCloseExplore}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CareerPathsView
