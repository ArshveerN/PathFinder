import { useState } from 'react'

function useApp() {
  const [message, setMessage] = useState('')
  const [currentView, setCurrentView] = useState('dashboard')
  const [selectedCareer, setSelectedCareer] = useState(null)

  const handleClick = (section) => {
    if (section === 'Career Paths') {
      setCurrentView('careerPaths')
    } else if (section === 'US Course Reporting') {
      setCurrentView('browseCourses')
    } else if (section === 'Q&A') {
  setCurrentView('qanda')
    } else {
      setMessage(`${section}: Locked`)
    }
  }

  const goToDashboard = () => setCurrentView('dashboard')
  const goToCareerPaths = () => setCurrentView('careerPaths')
  const goToBrowseCourses = () => setCurrentView('browseCourses')
  
  const openRoadmap = (career) => {
    setSelectedCareer(career)
    setCurrentView('roadmap')
  }

  return {
    message,
    currentView,
    selectedCareer,
    handleClick,
    goToDashboard,
    goToCareerPaths,
    goToBrowseCourses,
    openRoadmap
  }
}

export default useApp
