import { useState, useEffect } from 'react'

function useApp() {
  const [message, setMessage] = useState('')
  const [currentView, setCurrentView] = useState('dashboard')
  const [selectedCareer, setSelectedCareer] = useState(null)

  // Initialize from URL on mount
  useEffect(() => {
    const hash = window.location.hash.slice(1) || 'dashboard'
    const params = new URLSearchParams(window.location.search)
    const career = params.get('career')
    
    setCurrentView(hash)
    if (career) setSelectedCareer(career)
  }, [])

  // Handle back button
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.slice(1) || 'dashboard'
      const params = new URLSearchParams(window.location.search)
      const career = params.get('career')
      
      setCurrentView(hash)
      if (career) setSelectedCareer(career)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const handleClick = (section) => {
    let newView = 'dashboard'
    
    if (section === 'Career Paths') {
      newView = 'careerPaths'
    } else if (section === 'US Course Reporting') {
      newView = 'browseCourses'
    } else if (section === 'Q&A') {
      newView = 'qanda'
    } else {
      setMessage(`${section}: Locked`)
      return
    }

    setCurrentView(newView)
    window.history.pushState({ view: newView }, '', `#${newView}`)
  }

  const goToDashboard = () => {
    setCurrentView('dashboard')
    window.history.pushState({ view: 'dashboard' }, '', '#dashboard')
  }

  const goToCareerPaths = () => {
    setCurrentView('careerPaths')
    window.history.pushState({ view: 'careerPaths' }, '', '#careerPaths')
  }

  const goToBrowseCourses = () => {
    setCurrentView('browseCourses')
    window.history.pushState({ view: 'browseCourses' }, '', '#browseCourses')
  }
  
  const openRoadmap = (career) => {
    setSelectedCareer(career)
    setCurrentView('roadmap')
    window.history.pushState(
      { view: 'roadmap', career },
      '',
      `#roadmap?career=${encodeURIComponent(career)}`
    )
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