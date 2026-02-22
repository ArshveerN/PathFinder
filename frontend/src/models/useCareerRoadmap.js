import { useState, useEffect, useCallback } from 'react';
import supabase from '../supabaseClient';
import jobPaths from '../data/jobPaths';

/**
 * Extract flat dependency list from a parsed prerequisite tree.
 *   - Simple string: "ANT101H5"
 *   - Array: ["and", "ANT101H5", "BIO152H5"]
 *   - Nested: ["or", ["and", "A", "B"], "C"]
 */
function extractDependencies(prereqNode, parentType = 'AND') {
  if (!prereqNode) return [];

  if (typeof prereqNode === 'string') {
    return [{ code: prereqNode.trim(), type: parentType }];
  }

  if (Array.isArray(prereqNode) && prereqNode.length >= 2) {
    const operator = prereqNode[0].toUpperCase();
    const operands = prereqNode.slice(1);
    let deps = [];
    operands.forEach(op => {
      deps = [...deps, ...extractDependencies(op, operator)];
    });
    const seen = new Set();
    return deps.filter(d => {
      if (seen.has(d.code)) return false;
      seen.add(d.code);
      return true;
    });
  }

  return [];
}

/**
 * Parse the Prerequisites_parsed column.
 * In Supabase it's stored as TEXT, so values like:
 *   '["or", "CSC148H5", "CSC111H5"]'
 *   'CSC209H5'
 *   'NULL' / null / ''
 * need to be handled.
 */
function parsePrereqColumn(raw) {
  if (!raw || raw === 'NULL' || raw === 'null') return null;

  // Already an object/array (if Supabase returns JSONB)
  if (typeof raw === 'object') return raw;

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed || trimmed === 'NULL' || trimmed === 'null') return null;

    // Try JSON parse (handles arrays like '["or", "CSC148H5"]')
    try {
      return JSON.parse(trimmed);
    } catch {
      // Not valid JSON — might be a plain course code like "CSC209H5"
      // Check if it looks like a course code (letters + digits)
      if (/^[A-Z]{2,4}\d{3}[A-Z0-9]*$/i.test(trimmed)) {
        return trimmed;
      }
      return null;
    }
  }

  return null;
}

async function fetchAllCourses() {
  const PAGE_SIZE = 1000;
  let all = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('Courses')
      .select('*')
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return all;
}

function useCareerRoadmap(career) {
  const [loading, setLoading] = useState(true);
  const [coursesWithRequirements, setCoursesWithRequirements] = useState([]);

  const pathCourses = jobPaths[career] || [];

  const buildCourseDetails = useCallback((courseCode, courseMap, pathSet) => {
    const row = courseMap.get(courseCode);

    // Try both column name casings since Supabase preserves the original
    const raw = row?.['Prerequisites_parsed'] ?? row?.['prerequisites_parsed'] ?? null;
    const logicTree = parsePrereqColumn(raw);
    const requirements = extractDependencies(logicTree);

    return {
      courseCode,
      name: row?.Name ?? row?.name ?? '',
      description: row?.Description ?? row?.description ?? '',
      requirements: requirements.map(req => ({
        ...req,
        inPath: pathSet.has(req.code),
      })),
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        const allCourses = await fetchAllCourses();

        // Build lookup — handle both 'Course Code' and 'code' column names
        const courseMap = new Map();
        allCourses.forEach(row => {
          const code = row['Course Code'] ?? row['course_code'] ?? row.code ?? '';
          if (code) courseMap.set(code, row);
        });

        const pathSet = new Set(pathCourses);
        const data = pathCourses
          .filter(code => courseMap.has(code))
          .map(code => buildCourseDetails(code, courseMap, pathSet));

        if (!cancelled) setCoursesWithRequirements(data);
      } catch (err) {
        console.error('Error loading roadmap:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, [career, pathCourses, buildCourseDetails]);

  const getCourseDetails = useCallback((courseCode) => {
    const existing = coursesWithRequirements.find(c => c.courseCode === courseCode);
    if (existing) return existing;
    return { courseCode, name: '', description: '', requirements: [] };
  }, [coursesWithRequirements]);

  return {
    pathCourses,
    coursesWithRequirements,
    getCourseDetails,
    loading,
  };
}

export default useCareerRoadmap;