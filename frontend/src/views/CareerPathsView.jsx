import './CareerPaths.css'

function CareerPathsView({ 
  savedPaths, 
  showExplore, 
  allCareers, 
  onBack, 
  onOpenRoadmap, 
  onAddPath, 
  onToggleExplore, 
  onCloseExplore 
}) {
  return (
    <div className="career-paths-container">
      <div className="career-paths-header">
        <h1>CAREER PATHS</h1>
        <div className="header-tabs">
          <button className="tab active" onClick={onBack}>Dashboard</button>
        </div>
      </div>

      <div className="career-paths-content">
        <h2>Saved Paths:</h2>
        <div className="saved-paths-grid">
          {savedPaths.map((path, index) => (
            <button
              key={index}
              className="career-card career-tab"
              onClick={() => onOpenRoadmap(path)}
            >
              {path}
            </button>
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
                    className="career-list-item"
                    onClick={() => onAddPath(career)}
                  >
                    {career}
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
