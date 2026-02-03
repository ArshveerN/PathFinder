import '../App.css'

function DashboardView({ message, onSectionClick, onDashboardClick }) {
  return (
    <div className="app">
      <header className="header">
        <h1>PathFinder - My Search's Info</h1>
      </header>

      <nav className="nav">
        <button onClick={onDashboardClick}>Dashboard</button>
      </nav>

      <div className="dashboard">
        <div className="section">
          <h2>Career Paths</h2>
          <p>Find career-aligned course pathways</p>
          <button onClick={() => onSectionClick('Career Paths')}>Explore Career Paths</button>
        </div>

        <div className="section">
          <h2>Course Reporting</h2>
          <p>Browse course offering and year availability</p>
          <button onClick={() => onSectionClick('US Course Reporting')}>Browse Courses</button>
        </div>

        <div className="section">
          <h2>Grade Predictor</h2>
          <p>Calculate GPA based on your predicted grades</p>
          <button onClick={() => onSectionClick('Grade Predictor')}>Predict Grades</button>
        </div>

        <div className="section">
          <h2>Q&A</h2>
          <p>Ask and answer course-related questions</p>
          <button onClick={() => onSectionClick('Q&A')}>Visit Forum</button>
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

export default DashboardView
