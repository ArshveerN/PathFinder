import { useState } from 'react'
import jobPaths from '../data/jobPaths'

function useCareerPaths() {
  const [savedPaths, setSavedPaths] = useState([])
  const [showExplore, setShowExplore] = useState(false)

  const allCareers = Object.keys(jobPaths)

  const handleAddPath = (careerName) => {
    if (!savedPaths.includes(careerName)) {
      setSavedPaths([...savedPaths, careerName])
    }
    setShowExplore(false)
  }

  const toggleExplore = () => setShowExplore(!showExplore)
  const closeExplore = () => setShowExplore(false)

  return {
    savedPaths,
    showExplore,
    allCareers,
    handleAddPath,
    toggleExplore,
    closeExplore
  }
}

export default useCareerPaths
