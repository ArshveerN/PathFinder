import '../App.css'

function DashboardView({ message, onSectionClick, onDashboardClick, onLogout, userEmail }) {
  return (
    <div className="app">
      <header className="header">
        <h1>PathFinder - My Search's Info</h1>
      </header>

      <nav className="nav">
        <button onClick={onDashboardClick}>Dashboard</button>
        {onLogout && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
            {userEmail && <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px' }}>{userEmail}</span>}
            <button onClick={onLogout}>Logout</button>
          </div>
        )}
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
