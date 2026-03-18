import { useState, useEffect, useCallback, useMemo } from 'react'
import useCourses from './useCourses.jsx'
import jobPaths from '../data/jobPaths'

function extractDependencies(prereqNode, parentType = 'AND') {
  if (!prereqNode) return []

  if (typeof prereqNode === 'string') {
    return [{ code: prereqNode.trim(), type: parentType }]
  }

  if (Array.isArray(prereqNode) && prereqNode.length >= 2) {
    const operator = prereqNode[0].toUpperCase()
    const operands = prereqNode.slice(1)
    let deps = []
    operands.forEach(op => {
      deps = [...deps, ...extractDependencies(op, operator)]
    })
    const seen = new Set()
    return deps.filter(d => {
      if (seen.has(d.code)) return false
      seen.add(d.code)
      return true
    })
  }

  return []
}

function parsePrereqColumn(raw) {
  if (!raw || raw === 'NULL' || raw === 'null') return null

  if (typeof raw === 'object') return raw

  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!trimmed || trimmed === 'NULL' || trimmed === 'null') return null

    try {
      return JSON.parse(trimmed)
    } catch {
      if (/^[A-Z]{2,4}\d{3}[A-Z0-9]*$/i.test(trimmed)) {
        return trimmed
      }
      return null
    }
  }

  return null
}

function useCareerRoadmap(career) {
  const { courses: allCourses, loading: coursesLoading } = useCourses()
  const [coursesWithRequirements, setCoursesWithRequirements] = useState([])
  const [loading, setLoading] = useState(true)

  const pathCourses = jobPaths[career] || []

  const courseMap = useMemo(() => {
    const map = new Map()
    allCourses.forEach(row => {
      const code = row['Course Code'] ?? row['course_code'] ?? row.code ?? ''
      if (code) map.set(code, row)
    })
    return map
  }, [allCourses])

  const buildCourseDetails = useCallback((courseCode, pathSet) => {
    const row = courseMap.get(courseCode)

    const raw = row?.['Prerequisites_parsed'] ?? row?.['prerequisites_parsed'] ?? null
    const logicTree = parsePrereqColumn(raw)
    const requirements = extractDependencies(logicTree)

    return {
      courseCode,
      name: row?.Name ?? row?.name ?? '',
      description: row?.Description ?? row?.description ?? '',
      requirements: requirements.map(req => ({
        ...req,
        inPath: pathSet.has(req.code),
      })),
    }
  }, [courseMap])

  useEffect(() => {
    if (coursesLoading) return

    const pathSet = new Set(pathCourses)
    const data = pathCourses
      .filter(code => courseMap.has(code))
      .map(code => buildCourseDetails(code, pathSet))

    setCoursesWithRequirements(data)
    setLoading(false)
  }, [coursesLoading, career, pathCourses, courseMap, buildCourseDetails])

  const getCourseDetails = useCallback((courseCode) => {
    const existing = coursesWithRequirements.find(c => c.courseCode === courseCode)
    if (existing) return existing
    return { courseCode, name: '', description: '', requirements: [] }
  }, [coursesWithRequirements])

  return {
    pathCourses,
    coursesWithRequirements,
    getCourseDetails,
    loading: coursesLoading || loading,
  }
}

export default useCareerRoadmap
