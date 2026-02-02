import { useState } from 'react'
import './App.css'
import CareerPaths from './components/CareerPaths'
import CareerRoadmap from './components/CareerRoadmap'
import BrowseCourses from './components/BrowseCourses'

function App() {
    const [message, setMessage] = useState('')
    const [currentView, setCurrentView] = useState('dashboard')
    const [selectedCareer, setSelectedCareer] = useState(null)

    const handleClick = (section) => {
        if (section === 'Career Paths') {
            setCurrentView('careerPaths')
        } else if (section === 'US Course Reporting') {
            setCurrentView('browseCourses')
        } else {
            setMessage(`${section}: Locked`)
        }
    }

    if (currentView === 'careerPaths') {
        return (
            <CareerPaths
                onBack={() => setCurrentView('dashboard')}
                onOpenRoadmap={(career) => {
                    setSelectedCareer(career)
                    setCurrentView('roadmap')
                }}
            />
        )
    }

    if (currentView === 'roadmap') {
        return (
            <CareerRoadmap
                career={selectedCareer}
                onBack={() => setCurrentView('careerPaths')}
            />
        )
    }

    if (currentView === 'browseCourses') {
        return (
            <BrowseCourses onBack={() => setCurrentView('dashboard')} />
        )
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
                    <h2>Course Reporting</h2>
                    <p>Browse course offering and year availability</p>
                    <button onClick={() => handleClick('US Course Reporting')}>Browse Courses</button>
                </div>

                <div className="section">
                    <h2>Grade Predictor</h2>
                    <p>Calculate GPA based on your predicted grades</p>
                    <button onClick={() => handleClick('Grade Predictor')}>Predict Grades</button>
                </div>

                <div className="section">
                    <h2>Q&A</h2>
                    <p>Ask and answer course-related questions</p>
                    <button onClick={() => handleClick('Q&A')}>Visit Forum</button>
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
