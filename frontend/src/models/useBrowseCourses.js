import { useEffect, useState } from 'react'
import supabase, { SUPABASE_URL, SUPABASE_ANON_KEY } from '../supabaseClient'

function useBrowseCourses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    async function fetchCourses() {
      try {
        setLoading(true)
        let allCourses = []
        const pageSize = 1000
        let from = 0

        while (true) {
          const { data, error } = await supabase
            .from('Courses')
            .select('*')
            .range(from, from + pageSize - 1)

          if (error) throw error
          allCourses = [...allCourses, ...data]
          if (data.length < pageSize) break
          from += pageSize
        }

        if (mounted) setCourses(allCourses)
      } catch (err) {
        setError(err.message || String(err))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchCourses()
    return () => { mounted = false }
  }, [])

  console.log('Supabase client using:', { SUPABASE_URL: SUPABASE_URL ? 'SET' : 'MISSING', SUPABASE_ANON_KEY: SUPABASE_ANON_KEY ? 'SET' : 'MISSING' })

  return { courses, loading, error }
}

export default useBrowseCourses
