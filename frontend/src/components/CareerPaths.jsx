import { useState } from 'react'
import jobPaths from '../data/jobPaths'
import './CareerPaths.css'

function CareerPaths({ onBack, onOpenRoadmap }) {
  const [savedPaths, setSavedPaths] = useState(['Full Stack Developer', 'Cyber Security', 'Neuroscience'])
  const [showExplore, setShowExplore] = useState(false)

  const handleAddPath = (careerName) => {
    if (!savedPaths.includes(careerName)) {
      setSavedPaths([...savedPaths, careerName])
    }
    setShowExplore(false)
  }

  const allCareers = Object.keys(jobPaths)

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
          onClick={() => setShowExplore(!showExplore)}
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
                    onClick={() => handleAddPath(career)}
                  >
                    {career}
                  </button>
                ))}
              </div>
              <button 
                className="close-button"
                onClick={() => setShowExplore(false)}
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

export default CareerPaths
