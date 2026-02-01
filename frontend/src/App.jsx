import { useState } from 'react'
import './App.css'
import CareerPaths from './components/CareerPaths'

function App() {
  const [message, setMessage] = useState('')
  const [currentView, setCurrentView] = useState('dashboard')

  const handleClick = (section) => {
    if (section === 'Career Paths') {
      setCurrentView('careerPaths')
    } else {
      setMessage(`${section}: Locked`)
    }
  }

  if (currentView === 'careerPaths') {
    return <CareerPaths onBack={() => setCurrentView('dashboard')} />
  }

  return (
    <div className="app">
      <header className="header">
        <h1>PathFinder - My Seach's Info</h1>
      </header>
      
      <nav className="nav">
        <button onClick={() => setCurrentView('dashboard')}>Dashboard</button>
      </nav>

      <div className="dashboard">
        <div className="section">
          <h2>Career Paths</h2>
          <p>Find career-aligned course pathways</p>
          <button onClick={() => handleClick('Career Paths')}>Explore Career Paths</button>
        </div>

        <div className="section">
          <h2>US Course Reporting</h2>
          <p>Browse course offering and year availability</p>
          <button onClick={() => handleClick('US Course Reporting')}>Browse Courses</button>
        </div>

        <div className="section">
          <h2>CS2014 Grade Predictor</h2>
          <p>Calculate GPA based on your predicted grades</p>
          <button onClick={() => handleClick('CS2014 Grade Predictor')}>Predict Grades</button>
        </div>

        <div className="section">
          <h2>CS10.1A Exam</h2>
          <p>View exam schedules and resources</p>
          <button onClick={() => handleClick('CS10.1A Exam')}>View Exam</button>
        </div>
      </div>

      {message && (
        <div className="message">
          {message}
        </div>
      )}
    </div>
  )
}

export default App
