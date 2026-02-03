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
        const { data, error } = await supabase.from('Courses').select('*')
        if (error) throw error
        if (mounted) setCourses(data ?? [])
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
