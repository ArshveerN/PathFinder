function CareerRoadmapView({ career, coursesWithRequirements, onBack }) {
  return (
    <div className="career-roadmap" style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div className="roadmap-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={onBack} style={{ cursor: 'pointer', padding: '8px 16px' }}>← Back</button>
        <h1 style={{ margin: 0 }}>{career} Roadmap</h1>
      </div>

      <div style={{ background: '#1e1e1e', padding: '12px', borderRadius: '8px', marginBottom: '20px', color: '#ccc', fontSize: '0.9rem', fontFamily: 'monospace' }}>
        <div>Legend: <span style={{ color: '#4ade80' }}>● In Path</span> | <span style={{ color: '#f87171' }}>▲ External Requirement</span></div>
        <div>Logic:  <span style={{ color: '#fff' }}>(AND) = Mandatory</span> | <span style={{ color: '#fbbf24' }}>(OR) = Optional</span></div>
      </div>

      <div className="roadmap-content">
        {coursesWithRequirements.map((course, i) => (
          <div key={i} style={{ marginBottom: '20px', fontFamily: 'monospace' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff', background: '#333', padding: '8px', borderRadius: '4px' }}>
               {course.courseCode}
            </div>

            <div style={{ paddingLeft: '20px', marginTop: '8px' }}>
              {course.requirements.length === 0 ? (
                <div style={{ color: '#4ade80' }}>└── No Prerequisites (Start Here!)</div>
              ) : (
                course.requirements.map((req, idx) => {
                  const isLast = idx === course.requirements.length - 1
                  const prefix = isLast ? "└──" : "├──"
                  const color = req.inPath ? '#4ade80' : '#f87171'
                  const typeLabel = req.type === 'OR' ? <span style={{ color: '#fbbf24' }}>(OR)</span> : <span style={{ color: '#888' }}>(AND)</span>

                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ color: '#666' }}>{prefix}</span>
                      <span style={{ color: color, fontWeight: req.inPath ? 'bold' : 'normal' }}>{req.code}</span>
                      {typeLabel}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CareerRoadmapView
