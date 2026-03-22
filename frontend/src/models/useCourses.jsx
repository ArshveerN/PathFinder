import { createContext, useContext, useState, useEffect } from 'react'
import supabase from '../supabaseClient'

const CoursesContext = createContext(null)

async function fetchAllCourses() {
  const PAGE_SIZE = 1000
  let all = []
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from('Courses')
      .select(`
        *,
        course_rating_stats(average_rating, total_reviews)
      `)
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw new Error(error.message)
    if (!data || data.length === 0) break
    all = all.concat(data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return all
}

export function CoursesProvider({ children }) {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refreshCourses = async () => {
    try {
      const data = await fetchAllCourses()
      setCourses(data)
    } catch (err) {
      setError(err.message || String(err))
    }
  }

  useEffect(() => {
    let mounted = true

    fetchAllCourses()
      .then(data => {
        if (mounted) setCourses(data)
      })
      .catch(err => {
        if (mounted) setError(err.message || String(err))
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => { mounted = false }
  }, [])

  return (
    <CoursesContext.Provider value={{ courses, loading, error, refreshCourses }}>
      {children}
    </CoursesContext.Provider>
  )
}

export default function useCourses() {
  const ctx = useContext(CoursesContext)
  if (!ctx) throw new Error('useCourses must be used within a CoursesProvider')
  return ctx
}