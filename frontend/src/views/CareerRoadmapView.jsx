import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import './CareerRoadmapView.css'

function getCourseLevel(code) {
  const match = code.match(/\d+/)
  if (!match) return 0
  const num = parseInt(match[0], 10)
  return Math.max(0, Math.floor(num / 100) - 1)
}

function buildColumns(courses) {
  const codeSet = new Set(courses.map(c => c.courseCode))
  const courseMap = new Map(courses.map(c => [c.courseCode, c]))
  const depths = new Map()
  const computing = new Set()

  function getPrereqDepth(code) {
    if (depths.has(code)) return depths.get(code)
    if (computing.has(code)) return 0
    computing.add(code)
    const course = courseMap.get(code)
    if (!course || course.requirements.length === 0) { depths.set(code, 0); return 0 }
    const inPathReqs = course.requirements.filter(r => codeSet.has(r.code))
    if (inPathReqs.length === 0) { depths.set(code, 0); return 0 }
    const maxReq = Math.max(...inPathReqs.map(r => getPrereqDepth(r.code)))
    const d = maxReq + 1
    depths.set(code, d)
    return d
  }

  courses.forEach(c => getPrereqDepth(c.courseCode))

  const finalRows = new Map()
  courses.forEach(c => {
    const prereqRow = depths.get(c.courseCode) || 0
    const levelRow = getCourseLevel(c.courseCode)
    finalRows.set(c.courseCode, Math.max(prereqRow, levelRow))
  })

  const edges = []
  courses.forEach(c => {
    c.requirements.forEach(req => {
      if (codeSet.has(req.code)) edges.push({ from: req.code, to: c.courseCode, type: req.type })
    })
  })

  // Enforce prerequisite ordering
  for (let iter = 0; iter < 20; iter++) {
    let changed = false
    edges.forEach(e => {
      const fromR = finalRows.get(e.from) || 0
      const toR = finalRows.get(e.to) || 0
      if (fromR >= toR) { finalRows.set(e.to, fromR + 1); changed = true }
    })
    if (!changed) break
  }

  // Enforce level ordering
  const levels = new Map()
  courses.forEach(c => {
    const lvl = getCourseLevel(c.courseCode)
    if (!levels.has(lvl)) levels.set(lvl, [])
    levels.get(lvl).push(c.courseCode)
  })
  const maxLevel = Math.max(...Array.from(levels.keys(), v => v), 0)
  let maxAssigned = -1
  for (let lvl = 0; lvl <= maxLevel; lvl++) {
    const codes = levels.get(lvl) || []
    if (codes.length === 0) continue
    const minRow = Math.min(...codes.map(code => finalRows.get(code) || 0))
    if (minRow <= maxAssigned) {
      const delta = maxAssigned - minRow + 1
      courses.forEach(c => {
        if (getCourseLevel(c.courseCode) >= lvl)
          finalRows.set(c.courseCode, (finalRows.get(c.courseCode) || 0) + delta)
      })
    }
    const maxRowThis = Math.max(...codes.map(code => finalRows.get(code) || 0))
    maxAssigned = Math.max(maxAssigned, maxRowThis)
  }

  // Re-apply prerequisite ordering
  for (let iter = 0; iter < 10; iter++) {
    let changed = false
    edges.forEach(e => {
      const fromR = finalRows.get(e.from) || 0
      const toR = finalRows.get(e.to) || 0
      if (fromR >= toR) { finalRows.set(e.to, fromR + 1); changed = true }
    })
    if (!changed) break
  }

  const maxRow = Math.max(...Array.from(finalRows.values()), 0)
  const columns = []
  for (let i = 0; i <= maxRow; i++) columns.push([])
  courses.forEach(c => { columns[finalRows.get(c.courseCode) || 0].push(c) })

  return { columns, edges, finalRows }
}

// ── Base layout constants (at zoom = 1) ──
const B_NODE_W = 140
const B_NODE_H = 52
const B_COL_GAP = 64
const B_ROW_GAP = 72
const B_PAD_LEFT = 24
const B_PAD_TOP = 64
const B_FONT = 12.5

const ZOOM_MIN = 0.3
const ZOOM_MAX = 2.0
const ZOOM_STEP = 0.15

// MODIFICATION: destructured props now include loading
function CareerRoadmapView({ career, coursesWithRequirements, getCourseDetails, loading, onBack }) {
  const [selectedNode, setSelectedNode] = useState(null)
  const containerRef = useRef(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 })

  const { columns, edges } = useMemo(() => buildColumns(coursesWithRequirements), [coursesWithRequirements])
  const pathCodes = useMemo(() => new Set(coursesWithRequirements.map(c => c.courseCode)), [coursesWithRequirements])

  // ── Compute BASE positions (zoom=1) with relaxation ──
  const { basePositions, baseW, baseH } = useMemo(() => {
    const pos = new Map()
    const maxColsLen = Math.max(0, ...columns.map(c => c.length))
    const maxRowWidth = maxColsLen * B_NODE_W + Math.max(0, (maxColsLen - 1)) * B_COL_GAP

    columns.forEach((row, rowIdx) => {
      const rowY = B_PAD_TOP + rowIdx * (B_NODE_H + B_ROW_GAP)
      const totalWidth = row.length * B_NODE_W + Math.max(0, (row.length - 1)) * B_COL_GAP
      const startX = B_PAD_LEFT + (maxRowWidth - totalWidth) / 2
      row.forEach((course, colIdx) => {
        pos.set(course.courseCode, { x: startX + colIdx * (B_NODE_W + B_COL_GAP), y: rowY })
      })
    })

    // Parent map
    const parentMap = new Map()
    edges.forEach(e => {
      if (!parentMap.has(e.to)) parentMap.set(e.to, [])
      parentMap.get(e.to).push(e.from)
    })
    const cx = (code) => pos.get(code).x + B_NODE_W / 2

    // Relaxation
    for (let it = 0; it < 6; it++) {
      pos.forEach((v, code) => {
        const parents = parentMap.get(code) || []
        if (parents.length === 0) return
        const avg = parents.reduce((s, p) => s + cx(p), 0) / parents.length - B_NODE_W / 2
        v.x = v.x + (avg - v.x) * 0.6
      })
      columns.forEach((row) => {
        const rowNodes = row.map(c => ({ code: c.courseCode, x: pos.get(c.courseCode).x })).sort((a, b) => a.x - b.x)
        for (let i = 1; i < rowNodes.length; i++) {
          const minX = rowNodes[i - 1].x + B_NODE_W + Math.max(8, Math.floor(B_COL_GAP / 3))
          if (rowNodes[i].x < minX) {
            const shift = minX - rowNodes[i].x
            for (let j = i; j < rowNodes.length; j++) { pos.get(rowNodes[j].code).x += shift; rowNodes[j].x += shift }
          }
        }
      })
    }

    // Center
    let gMinX = Infinity, gMaxX = -Infinity
    pos.forEach(v => { gMinX = Math.min(gMinX, v.x); gMaxX = Math.max(gMaxX, v.x + B_NODE_W) })
    if (!isFinite(gMinX)) { gMinX = 0; gMaxX = maxRowWidth + B_PAD_LEFT * 2 }
    const graphW = gMaxX - gMinX
    const cw = Math.max(maxRowWidth + B_PAD_LEFT * 2, graphW + B_PAD_LEFT * 2)
    const shiftX = (cw - graphW) / 2 - gMinX
    pos.forEach(v => { v.x += shiftX })

    const ch = B_PAD_TOP * 2 + columns.length * B_NODE_H + Math.max(0, (columns.length - 1)) * B_ROW_GAP
    return { basePositions: pos, baseW: cw, baseH: ch }
  }, [columns, edges])

  // ── Ancestor chain for highlighting ──
  const { ancestorNodes, ancestorEdges } = useMemo(() => {
    if (!selectedNode) return { ancestorNodes: new Set(), ancestorEdges: new Set() }
    const rev = new Map()
    edges.forEach(e => {
      if (!rev.has(e.to)) rev.set(e.to, [])
      rev.get(e.to).push(e.from)
    })
    const nodes = new Set()
    const edgeSet = new Set()
    const stack = [selectedNode]
    while (stack.length) {
      const cur = stack.pop()
      ;(rev.get(cur) || []).forEach(f => {
        if (!nodes.has(f)) { nodes.add(f); stack.push(f) }
        edgeSet.add(`${f}->${cur}`)
      })
    }
    return { ancestorNodes: nodes, ancestorEdges: edgeSet }
  }, [selectedNode, edges])

  // ── Zoomed sizes (native resolution) ──
  const nw = B_NODE_W * zoom
  const nh = B_NODE_H * zoom
  const fontSize = B_FONT * zoom
  const canvasW = baseW * zoom
  const canvasH = baseH * zoom

  const nodePositions = useMemo(() => {
    const zp = new Map()
    basePositions.forEach((v, code) => { zp.set(code, { x: v.x * zoom, y: v.y * zoom }) })
    return zp
  }, [basePositions, zoom])

  // ── Fit on load ──
  useEffect(() => {
    const el = containerRef.current
    if (!el || baseW === 0) return
    const vw = el.clientWidth
    const vh = el.clientHeight
    const fz = Math.max(ZOOM_MIN, Math.min(1, Math.min((vw - 60) / baseW, (vh - 60) / baseH)))
    setZoom(fz)
    setPan({ x: (vw - baseW * fz) / 2, y: 20 })
  }, [baseW, baseH])

  // ── Ctrl+Scroll zoom (centered on cursor) ──
  const handleWheel = useCallback((e) => {
    if (!e.ctrlKey && !e.metaKey) return
    e.preventDefault()
    const rect = containerRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    setZoom(prev => {
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
      const nz = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, prev + delta))
      const ratio = nz / prev
      setPan(p => ({ x: mx - ratio * (mx - p.x), y: my - ratio * (my - p.y) }))
      return nz
    })
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  // ── Mouse pan ──
  const handleMouseDown = useCallback((e) => {
    if (e.button === 1 || (e.button === 0 && !e.target.closest('.flow-node'))) {
      e.preventDefault()
      setIsPanning(true)
      panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }
    }
  }, [pan])

  const handleMouseMove = useCallback((e) => {
    if (!isPanning) return
    setPan({ x: panStart.current.panX + (e.clientX - panStart.current.x), y: panStart.current.panY + (e.clientY - panStart.current.y) })
  }, [isPanning])

  const handleMouseUp = useCallback(() => setIsPanning(false), [])

  useEffect(() => {
    if (!isPanning) return
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp) }
  }, [isPanning, handleMouseMove, handleMouseUp])

  const zoomTo = (newZoom) => {
    const el = containerRef.current
    const cx = el.clientWidth / 2, cy = el.clientHeight / 2
    const nz = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, newZoom))
    const ratio = nz / zoom
    setPan(p => ({ x: cx - ratio * (cx - p.x), y: cy - ratio * (cy - p.y) }))
    setZoom(nz)
  }

  const zoomFit = () => {
    const el = containerRef.current
    if (!el) return
    const vw = el.clientWidth, vh = el.clientHeight
    const fz = Math.max(ZOOM_MIN, Math.min(1, Math.min((vw - 60) / baseW, (vh - 60) / baseH)))
    setZoom(fz)
    setPan({ x: (vw - baseW * fz) / 2, y: Math.max(20, (vh - baseH * fz) / 2) })
  }

  const selectedCourse = useMemo(() => {
    if (!selectedNode) return null
    return getCourseDetails(selectedNode) 
  }, [selectedNode, getCourseDetails])

  // Stroke widths scaled
  const sw = 1.6 * zoom
  const swHL = 2.6 * zoom

  // INSERTION: Loading UI
  if (loading) {
    return (
      <div className="rm-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading Career Roadmap...</p>
      </div>
    )
  }

  return (
    <div className="rm-container" onClick={(e) => {
      if (!e.target.closest('.flow-node') && !e.target.closest('.zoom-controls'))
        setSelectedNode(null)
    }}>
      <div className="rm-header">
        <div className="rm-header-left">
          <button className="rm-back" onClick={onBack}>← Back</button>
          <h1 className="rm-title">{career} Roadmap</h1>
        </div>
        <span className="rm-count">{coursesWithRequirements.length} courses</span>
      </div>

      <div className="rm-legend">
        <div className="rm-legend-item">
          <div className="legend-swatch legend-start">BIO</div>
          <span>No prerequisites — start here</span>
        </div>
        <span className="rm-legend-sep" />
        <div className="rm-legend-item">
          <div className="legend-swatch legend-normal">CSC</div>
          <span>Requires prerequisites</span>
        </div>
        <span className="rm-legend-sep" />
        <div className="rm-legend-item">
          <div className="legend-swatch legend-selected">↑</div>
          <span>Selected &amp; ancestors</span>
        </div>
        <span className="rm-legend-hint">Ctrl+Scroll to zoom · Drag to pan</span>
      </div>

      <div className="flow-layout">
        <div
          className={`flow-scroll ${isPanning ? 'flow-scroll-grabbing' : ''}`}
          ref={containerRef}
          onMouseDown={handleMouseDown}
        >
          {/* Zoom controls */}
          <div className="zoom-controls">
            <button className="zoom-btn" onClick={() => zoomTo(zoom + ZOOM_STEP)}>+</button>
            <span className="zoom-level">{Math.round(zoom * 100)}%</span>
            <button className="zoom-btn" onClick={() => zoomTo(zoom - ZOOM_STEP)}>−</button>
            <button className="zoom-btn zoom-btn-fit" onClick={zoomFit}>Fit</button>
          </div>

          {/* Canvas: translate only for pan, sizes are natively scaled */}
          <div className="flow-canvas" style={{ width: canvasW, height: canvasH, transform: `translate(${pan.x}px, ${pan.y}px)` }}>
            <svg className="flow-svg" width={canvasW} height={canvasH}>
              <defs>
                <marker id="arrow-default" markerWidth="10" markerHeight="10" refX="8" refY="3.5" orient="auto" markerUnits="strokeWidth">
                  <path d="M0,0.5 L0,6.5 L8,3.5 z" fill="#9ca3af" />
                </marker>
                <marker id="arrow-highlight" markerWidth="10" markerHeight="10" refX="8" refY="3.5" orient="auto" markerUnits="strokeWidth">
                  <path d="M0,0.5 L0,6.5 L8,3.5 z" fill="#3b82f6" />
                </marker>
              </defs>

              {/* Non-highlighted edges */}
              {edges.filter(e => !(selectedNode && ancestorEdges.has(`${e.from}->${e.to}`))).map((edge, i) => {
                const fp = nodePositions.get(edge.from), tp = nodePositions.get(edge.to)
                if (!fp || !tp) return null
                const x1 = fp.x + nw / 2, y1 = fp.y + nh
                const x2 = tp.x + nw / 2, y2 = tp.y - 1 * zoom
                const dy = y2 - y1
                const bend = Math.max(28 * zoom, Math.min(dy * 0.42, 64 * zoom))
                return (
                  <path key={`e-${i}`}
                    d={`M ${x1} ${y1} C ${x1} ${y1 + bend}, ${x2} ${y2 - bend}, ${x2} ${y2}`}
                    fill="none" stroke="#c8cfd8" strokeWidth={sw} strokeLinecap="round"
                    markerEnd="url(#arrow-default)" />
                )
              })}

              {/* Highlighted edges on top */}
              {edges.filter(e => selectedNode && ancestorEdges.has(`${e.from}->${e.to}`)).map((edge, i) => {
                const fp = nodePositions.get(edge.from), tp = nodePositions.get(edge.to)
                if (!fp || !tp) return null
                const x1 = fp.x + nw / 2, y1 = fp.y + nh
                const x2 = tp.x + nw / 2, y2 = tp.y - 1 * zoom
                const dy = y2 - y1
                const bend = Math.max(28 * zoom, Math.min(dy * 0.42, 64 * zoom))
                return (
                  <path key={`hl-${i}`}
                    d={`M ${x1} ${y1} C ${x1} ${y1 + bend}, ${x2} ${y2 - bend}, ${x2} ${y2}`}
                    fill="none" stroke="#3b82f6" strokeWidth={swHL} strokeLinecap="round"
                    markerEnd="url(#arrow-highlight)" />
                )
              })}
            </svg>

            {/* Nodes */}
            {columns.map((col) =>
              col.map((course) => {
                const pos = nodePositions.get(course.courseCode)
                if (!pos) return null
                const hasPrereqs = course.requirements.length > 0
                const isSelected = selectedNode === course.courseCode
                const inAncestorPath = ancestorNodes.has(course.courseCode) || isSelected
                return (
                  <div key={course.courseCode}
                    className={`flow-node ${!hasPrereqs ? 'flow-node-start' : ''} ${isSelected ? 'flow-node-selected' : ''} ${inAncestorPath ? 'flow-node-path' : ''}`}
                    style={{
                      left: pos.x, top: pos.y, width: nw, height: nh,
                      borderRadius: 10 * zoom,
                      borderWidth: (isSelected || !hasPrereqs) ? 2 * zoom : 1.5 * zoom,
                    }}
                    onClick={(e) => { e.stopPropagation(); setSelectedNode(prev => prev === course.courseCode ? null : course.courseCode) }}
                  >
                    <span className="flow-node-code" style={{ fontSize }}>{course.courseCode}</span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Detail panel */}
        {selectedCourse && (
          <div className="fdp-overlay" onClick={() => setSelectedNode(null)}>
            <div className="flow-detail-panel" onClick={(e) => e.stopPropagation()}>
              <div className="fdp-header">
                <div style={{ paddingRight: '12px' }}>
                  <span className="fdp-code">{selectedCourse.courseCode}</span>
                  {selectedCourse.name && <h3 className="fdp-name">{selectedCourse.name}</h3>}
                </div>
                <button className="fdp-close" onClick={() => setSelectedNode(null)}>✕</button>
              </div>

              {selectedCourse.description && (
                <div className="fdp-desc">
                  {selectedCourse.description}
                </div>
              )}

              {selectedCourse.requirements.length === 0 ? (
                <div className="fdp-empty">
                  <span className="fdp-start-badge">Start Here</span>
                  <p>This course has no prerequisites.</p>
                </div>
              ) : (
                <div className="fdp-reqs">
                  <div className="fdp-section-title">Prerequisites</div>
                  {selectedCourse.requirements.filter(r => r.type === 'AND').length > 0 && (
                    <div className="fdp-group">
                      <span className="fdp-tag fdp-tag-and">AND — All required</span>
                      {selectedCourse.requirements.filter(r => r.type === 'AND').map((req, i) => (
                        <div key={i} className="fdp-req-row" onClick={() => setSelectedNode(req.code)}>
                          <span className={`fdp-dot ${pathCodes.has(req.code) ? 'dot-in' : 'dot-ext'}`} />
                          <span className="fdp-req-code">{req.code}</span>
                          <span className={pathCodes.has(req.code) ? 'fdp-label-in' : 'fdp-label-ext'}>
                            {pathCodes.has(req.code) ? 'In path' : 'External'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedCourse.requirements.filter(r => r.type === 'OR').length > 0 && (
                    <div className="fdp-group">
                      <span className="fdp-tag fdp-tag-or">OR — Choose one</span>
                      {selectedCourse.requirements.filter(r => r.type === 'OR').map((req, i) => (
                        <div key={i} className="fdp-req-row" onClick={() => setSelectedNode(req.code)}>
                          <span className={`fdp-dot ${pathCodes.has(req.code) ? 'dot-in' : 'dot-ext'}`} />
                          <span className="fdp-req-code">{req.code}</span>
                          <span className={pathCodes.has(req.code) ? 'fdp-label-in' : 'fdp-label-ext'}>
                            {pathCodes.has(req.code) ? 'In path' : 'External'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {(() => {
                const unlocks = edges.filter(e => e.from === selectedCourse.courseCode)
                if (unlocks.length === 0) return null
                return (
                  <div className="fdp-reqs" style={{ marginTop: 16 }}>
                    <div className="fdp-section-title">Unlocks</div>
                    <div className="fdp-group">
                      {unlocks.map((e, i) => (
                        <div key={i} className="fdp-req-row" onClick={() => setSelectedNode(e.to)}>
                          <span className="fdp-dot" style={{ background: '#3b82f6' }} />
                          <span className="fdp-req-code">{e.to}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CareerRoadmapView