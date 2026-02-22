import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import './CareerRoadmapView.css'

/**
 * Extract the course level index from a course code.
 * e.g. BIO152H5 -> 1 (100-level -> index 0), CSC207H5 -> 2 (200-level -> index 1)
 */
function getCourseLevel(code) {
  const match = code.match(/\d+/)
  if (!match) return 0
  const num = parseInt(match[0], 10)
  return Math.max(0, Math.floor(num / 100) - 1)
}

/**
 * Assign each course a row based on:
 *  - prerequisite depth (how many prereq steps to reach it), AND
 *  - course level (100-level min row 0, 200-level min row 1, etc.)
 * The final row is max(prereqDepth, levelIndex), so a 200-level course is
 * NEVER placed above a 100-level course.
 */
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
    if (!course || course.requirements.length === 0) {
      depths.set(code, 0)
      return 0
    }

    const inPathReqs = course.requirements.filter(r => codeSet.has(r.code))
    if (inPathReqs.length === 0) {
      depths.set(code, 0)
      return 0
    }

    const maxReq = Math.max(...inPathReqs.map(r => getPrereqDepth(r.code)))
    const d = maxReq + 1
    depths.set(code, d)
    return d
  }

  courses.forEach(c => getPrereqDepth(c.courseCode))

  // Final row = max(prereq depth, level-based minimum row)
  const finalRows = new Map()
  courses.forEach(c => {
    const prereqRow = depths.get(c.courseCode) || 0
    const levelRow = getCourseLevel(c.courseCode)
    finalRows.set(c.courseCode, Math.max(prereqRow, levelRow))
  })

  // Group into rows
  const maxRow = Math.max(...Array.from(finalRows.values()), 0)
  const columns = []
  for (let i = 0; i <= maxRow; i++) columns.push([])
  courses.forEach(c => {
    const row = finalRows.get(c.courseCode) || 0
    columns[row].push(c)
  })

  // Build edges: for each course, connect its in-path prereqs to it
  const edges = []
  courses.forEach(c => {
    c.requirements.forEach(req => {
      if (codeSet.has(req.code)) {
        edges.push({ from: req.code, to: c.courseCode, type: req.type })
      }
    })
  })

  return { columns, edges, finalRows }
}

const NODE_W = 140
const NODE_H = 52
const COL_GAP = 110
// increase row gap for more vertical spacing
const ROW_GAP = 72
const PAD_LEFT = 40
// increase top padding so first row sits lower
const PAD_TOP = 64

function CareerRoadmapView({ career, coursesWithRequirements, onBack }) {
  const [selectedNode, setSelectedNode] = useState(null)
  const svgRef = useRef(null)
  const containerRef = useRef(null)
  const [positions, setPositions] = useState(new Map())
  const [containerWidth, setContainerWidth] = useState(0)

  // Track the scroll container width so we can scale the canvas to fit
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    setContainerWidth(el.clientWidth)
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { columns, edges } = useMemo(
    () => buildColumns(coursesWithRequirements),
    [coursesWithRequirements]
  )

  // SVG marker IDs for arrowheads
  const MARKER_DEFAULT = 'arrow-default'
  const MARKER_HIGHLIGHT = 'arrow-highlight'

  const pathCodes = useMemo(
    () => new Set(coursesWithRequirements.map(c => c.courseCode)),
    [coursesWithRequirements]
  )

  // Calculate positions for each node (vertical layout: rows = depth)
  const nodePositions = useMemo(() => {
    const pos = new Map()
    // max width (number of nodes in the widest row)
    const maxColsLen = Math.max(0, ...columns.map(c => c.length))

    // compute the maximum row width in px
    const maxRowWidth = maxColsLen * NODE_W + Math.max(0, (maxColsLen - 1)) * COL_GAP

    // initial placement: center each row
    columns.forEach((row, rowIdx) => {
      const rowY = PAD_TOP + rowIdx * (NODE_H + ROW_GAP)
      const totalWidth = row.length * NODE_W + Math.max(0, (row.length - 1)) * COL_GAP
      const startX = PAD_LEFT + (maxRowWidth - totalWidth) / 2

      row.forEach((course, colIdx) => {
        pos.set(course.courseCode, {
          x: startX + colIdx * (NODE_W + COL_GAP),
          y: rowY,
        })
      })
    })

    // build parent map for alignment (to -> [from])
    const parentMap = new Map()
    edges.forEach(e => {
      if (!parentMap.has(e.to)) parentMap.set(e.to, [])
      parentMap.get(e.to).push(e.from)
    })

    const centerX = (code) => pos.get(code).x + NODE_W / 2

    // relaxation: align nodes under parents and resolve collisions per row
    const ITER = 6
    for (let it = 0; it < ITER; it++) {
      // align towards parent centroid
      pos.forEach((v, code) => {
        const parents = parentMap.get(code) || []
        if (parents.length === 0) return
        const avg = parents.reduce((s, p) => s + centerX(p), 0) / parents.length - NODE_W / 2
        // move fractionally towards average to keep stability
        v.x = v.x + (avg - v.x) * 0.6
      })

      // resolve collisions within each row
      columns.forEach((row) => {
        // collect nodes in row and sort by x
        const rowNodes = row.map(c => ({ code: c.courseCode, x: pos.get(c.courseCode).x }))
          .sort((a, b) => a.x - b.x)

        for (let i = 1; i < rowNodes.length; i++) {
          const prev = rowNodes[i - 1]
          const cur = rowNodes[i]
          const minX = prev.x + NODE_W + Math.max(8, Math.floor(COL_GAP / 3))
          if (cur.x < minX) {
            const shift = minX - cur.x
            // shift current and all following nodes to the right
            for (let j = i; j < rowNodes.length; j++) {
              pos.get(rowNodes[j].code).x += shift
              rowNodes[j].x += shift
            }
          }
        }
      })
    }

    return pos
  }, [columns, edges])

  // Total canvas size (width depends on min/max x after relaxation, height on number of rows)
  let minX = Infinity, maxX = -Infinity
  nodePositions.forEach((v) => {
    minX = Math.min(minX, v.x)
    maxX = Math.max(maxX, v.x + NODE_W)
  })
  if (!isFinite(minX)) {
    minX = 0
    // fallback width estimate
    const fallbackMaxCols = Math.max(0, ...columns.map(c => c.length))
    maxX = PAD_LEFT * 2 + fallbackMaxCols * NODE_W + Math.max(0, (fallbackMaxCols - 1)) * COL_GAP
  }
  const maxColsLen = Math.max(0, ...columns.map(c => c.length))
  const naturalWidth = Math.max(PAD_LEFT * 2 + maxColsLen * NODE_W + Math.max(0, (maxColsLen - 1)) * COL_GAP, Math.ceil(maxX - minX + PAD_LEFT * 2))
  const canvasWidth = naturalWidth
  // Scale the canvas down to fit if it is wider than the available container
  const scale = containerWidth > 0 && naturalWidth > containerWidth
    ? containerWidth / naturalWidth
    : 1
  // Center the computed node positions horizontally within the natural canvas width
  // (compute graph width and shift all node x positions so the graph is centered)
  const graphWidth = Math.max(0, maxX - minX)
  const desiredLeft = (naturalWidth - graphWidth) / 2
  const shiftX = isFinite(minX) ? (desiredLeft - minX) : 0
  if (shiftX && shiftX !== 0) {
    nodePositions.forEach((v) => { v.x = v.x + shiftX })
    // update minX/maxX after shift (useful if other logic relies on them)
    minX = Math.min(...Array.from(nodePositions.values()).map(v => v.x))
    maxX = Math.max(...Array.from(nodePositions.values()).map(v => v.x + NODE_W))
  }
  const canvasHeight = PAD_TOP * 2 + columns.length * NODE_H + Math.max(0, (columns.length - 1)) * ROW_GAP

  // Get the selected course's details
  const selectedCourse = useMemo(() => {
    if (!selectedNode) return null
    return coursesWithRequirements.find(c => c.courseCode === selectedNode)
  }, [selectedNode, coursesWithRequirements])

  // compute ancestors (prereq chain) for the selected node
  const { ancestorNodes, ancestorEdges } = useMemo(() => {
    if (!selectedNode) return { ancestorNodes: new Set(), ancestorEdges: new Set() }

    // build reverse adjacency: to -> [from]
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
      const froms = rev.get(cur) || []
      froms.forEach(f => {
        if (!nodes.has(f)) {
          nodes.add(f)
          stack.push(f)
        }
        edgeSet.add(`${f}->${cur}`)
      })
    }

    return { ancestorNodes: nodes, ancestorEdges: edgeSet }
  }, [selectedNode, edges])

  return (
    <div className="rm-container" onClick={(e) => {
      if (!e.target.closest('.flow-node') && !e.target.closest('.flow-detail-panel')) {
        setSelectedNode(null)
      }
    }}>
      {/* Header */}
      <div className="rm-header">
        <div className="rm-header-left">
          <button className="rm-back" onClick={onBack}>← Back</button>
          <h1 className="rm-title">{career} Roadmap</h1>
        </div>
        <span className="rm-count">{coursesWithRequirements.length} courses</span>
      </div>

      {/* Legend */}
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
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
          Click any course for details
        </span>
      </div>

      {/* Main content: flowchart + detail panel */}
      <div className="flow-layout">
        {/* Scrollable flowchart */}
        <div className="flow-scroll" ref={containerRef}>
          {/* Sizer: occupies the scaled height so the scrollbar is correct */}
          <div style={{ width: '100%', position: 'relative', height: canvasHeight * scale }}>
          {/* Canvas: full natural size but visually scaled to fit container */}
          <div className="flow-canvas" style={{ width: canvasWidth, height: canvasHeight, position: 'absolute', top: 0, left: 0, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            {/* SVG lines */}
            <svg
              ref={svgRef}
              className="flow-svg"
              width={canvasWidth}
              height={canvasHeight}
            >
              <defs>
                <marker id={MARKER_DEFAULT} markerWidth="10" markerHeight="10" refX="8" refY="3.5" orient="auto" markerUnits="strokeWidth">
                  <path d="M0,0.5 L0,6.5 L8,3.5 z" fill="#9ca3af" />
                </marker>
                <marker id={MARKER_HIGHLIGHT} markerWidth="10" markerHeight="10" refX="8" refY="3.5" orient="auto" markerUnits="strokeWidth">
                  <path d="M0,0.5 L0,6.5 L8,3.5 z" fill="#3b82f6" />
                </marker>
              </defs>
              {/* Draw non-highlighted edges first, then draw highlighted edges on top */}
              {edges.filter(e => {
                const key = `${e.from}->${e.to}`
                return !(selectedNode && ancestorEdges.has(key))
              }).map((edge, i) => {
                const fromPos = nodePositions.get(edge.from)
                const toPos = nodePositions.get(edge.to)
                if (!fromPos || !toPos) return null

                const x1 = fromPos.x + NODE_W / 2
                const y1 = fromPos.y + NODE_H
                const x2 = toPos.x + NODE_W / 2
                const y2 = toPos.y - 1

                const dy = y2 - y1
                const bend = Math.max(28, Math.min(dy * 0.42, 64))
                const d = `M ${x1} ${y1} C ${x1} ${y1 + bend}, ${x2} ${y2 - bend}, ${x2} ${y2}`

                return (
                  <path
                    key={`edge-${i}`}
                    d={d}
                    fill="none"
                    stroke="#c8cfd8"
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    markerEnd={`url(#${MARKER_DEFAULT})`}
                  />
                )
              })}

              {edges.filter(e => {
                const key = `${e.from}->${e.to}`
                return selectedNode && ancestorEdges.has(key)
              }).map((edge, i) => {
                const fromPos = nodePositions.get(edge.from)
                const toPos = nodePositions.get(edge.to)
                if (!fromPos || !toPos) return null

                const x1 = fromPos.x + NODE_W / 2
                const y1 = fromPos.y + NODE_H
                const x2 = toPos.x + NODE_W / 2
                const y2 = toPos.y - 1

                const dy = y2 - y1
                const bend = Math.max(28, Math.min(dy * 0.42, 64))
                const d = `M ${x1} ${y1} C ${x1} ${y1 + bend}, ${x2} ${y2 - bend}, ${x2} ${y2}`

                return (
                  <path
                    key={`edge-highlight-${i}`}
                    d={d}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth={2.6}
                    strokeLinecap="round"
                    markerEnd={`url(#${MARKER_HIGHLIGHT})`}
                  />
                )
              })}
            </svg>

            {/* Course nodes */}
            {columns.map((col, colIdx) =>
              col.map((course) => {
                const pos = nodePositions.get(course.courseCode)
                if (!pos) return null
                const hasPrereqs = course.requirements.length > 0
                const isSelected = selectedNode === course.courseCode
                const inAncestorPath = ancestorNodes.has(course.courseCode) || isSelected

                return (
                  <div
                    key={course.courseCode}
                    className={`flow-node ${!hasPrereqs ? 'flow-node-start' : ''} ${isSelected ? 'flow-node-selected' : ''} ${inAncestorPath ? 'flow-node-path' : ''}`}
                    style={{
                      left: pos.x,
                      top: pos.y,
                      width: NODE_W,
                      height: NODE_H,
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedNode(prev => prev === course.courseCode ? null : course.courseCode)
                    }}
                  >
                    <span className="flow-node-code">{course.courseCode}</span>
                  </div>
                )
              })
            )}
          </div>
          </div>
        </div>

        {/* Detail panel (right side) */}
        {selectedCourse && (
          <div className="flow-detail-panel">
            <div className="fdp-header">
              <span className="fdp-code">{selectedCourse.courseCode}</span>
              <button className="fdp-close" onClick={() => setSelectedNode(null)}>✕</button>
            </div>

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
                      <div key={i} className="fdp-req-row">
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
                      <div key={i} className="fdp-req-row">
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

            {/* Unlocks section */}
            {(() => {
              const unlocks = edges.filter(e => e.from === selectedCourse.courseCode)
              if (unlocks.length === 0) return null
              return (
                <div className="fdp-reqs" style={{ marginTop: 16 }}>
                  <div className="fdp-section-title">Unlocks</div>
                  <div className="fdp-group">
                    {unlocks.map((e, i) => (
                      <div key={i} className="fdp-req-row">
                        <span className="fdp-dot" style={{ background: '#3b82f6' }} />
                        <span className="fdp-req-code">{e.to}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}

export default CareerRoadmapView