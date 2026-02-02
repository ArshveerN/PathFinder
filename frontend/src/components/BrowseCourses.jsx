import { useEffect, useState } from 'react'
import supabase, { SUPABASE_URL, SUPABASE_ANON_KEY } from '../supabaseClient'
import './CareerPaths.css'

function BrowseCourses({ onBack }) {
    const [courses, setCourses] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        // Fetch courses immediately when this view is opened
        let mounted = true
        async function fetchCourses() {
            try {
                setLoading(true)

                // supabase client comes from ../supabaseClient which falls back to the known values
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

    return (
        <div className="career-paths-container">
            <div className="career-paths-header">
                <h1>All Courses</h1>
                <div className="header-tabs">
                    <button className="tab active" onClick={onBack}>Back</button>
                </div>
            </div>

            <div style={{ padding: 16 }}>
                {loading && <div>Loading courses...</div>}
                {error && <div style={{ color: 'red' }}>Error: {error}</div>}

                {!loading && !error && (
                    <div>
                        <p>Found {courses.length} courses.</p>
                        <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
                            {courses.map((c, i) => (
                                <div key={i} style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                                    <pre style={{ margin: 0 }}>{JSON.stringify(c, null, 2)}</pre>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default BrowseCourses
