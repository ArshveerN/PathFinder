import { useState, useMemo, useCallback, useEffect, memo } from 'react'
import supabase from '../supabaseClient'
import useAuth from '../models/useAuth'
import useCourses from '../models/useCourses'
import SubmitReviewForm from './SubmitReviewForm'
import './BrowseCoursesView.css'

const PAGE_SIZE = 40

const DIST_COLORS = {
  'Science': { bg: '#ecfdf5', text: '#065f46' },
  'Social Science': { bg: '#eff6ff', text: '#1e40af' },
  'Humanities': { bg: '#fef2f2', text: '#991b1b' },
}

const StarDisplay = ({ rating }) => {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <span style={{ color: '#f59e0b', fontSize: '0.85em', letterSpacing: '1px' }}>
        {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
      </span>
      <span style={{ fontWeight: '600', color: '#374151', fontSize: '0.82em' }}>
        {rating}/5
      </span>
    </span>
  )
}

const CourseCard = memo(function CourseCard({ course, currentUser, refreshCourses }) {
  const [expanded, setExpanded] = useState(false)
  const [reviews, setReviews] = useState([])
  const [loadingReviews, setLoadingReviews] = useState(false)
  
  const dist = DIST_COLORS[course.Distribution] || { bg: '#f3f4f6', text: '#4b5563' }
  const stats = course.course_rating_stats?.[0] || { average_rating: null, total_reviews: 0 }

  const fetchReviews = useCallback(async () => {
    setLoadingReviews(true)
    const { data } = await supabase
      .from('CourseReviews')
      .select('*')
      .eq('course_code', course['Course Code'])
      .order('created_at', { ascending: false })
    
    setReviews(data || [])
    setLoadingReviews(false)
  }, [course])

  useEffect(() => {
    if (expanded) fetchReviews()
  }, [expanded, fetchReviews])

  return (
    <div className="bc-card" onClick={(e) => {
      if (!e.target.closest('.bc-reviews-section') && !e.target.closest('button')) {
        setExpanded(!expanded)
      }
    }}>
      <div className="bc-card-row">
        <span className="bc-code">{course['Course Code']}</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {stats.total_reviews > 0 && (
            <span style={{ fontSize: '0.85em', fontWeight: 'bold', color: '#d97706', background: '#fef3c7', padding: '2px 8px', borderRadius: '12px' }}>
              ⭐ {stats.average_rating} ({stats.total_reviews})
            </span>
          )}
          <span className="bc-badge" style={{ background: dist.bg, color: dist.text }}>
            {course.Distribution || 'N/A'}
          </span>
        </div>
      </div>

      <h3 className="bc-name">{course.Name}</h3>

      <p className="bc-desc">
        {expanded
          ? course.Description
          : course.Description?.length > 160
            ? course.Description.slice(0, 160) + '…'
            : course.Description}
      </p>

      <div className="bc-meta">
        {course.Hours && <span className="bc-chip">{course.Hours}</span>}
        {course['Delivery Mode'] && <span className="bc-chip">{course['Delivery Mode']}</span>}
      </div>

      {expanded && (
        <div className="bc-details">
          {course.Prerequisites && (
            <div className="bc-detail"><span className="bc-detail-label">Prerequisites</span> {course.Prerequisites}</div>
          )}
          
          <div className="bc-reviews-section">
            <h4>Student Reviews</h4>
            {currentUser ? (
              <SubmitReviewForm 
                courseCode={course['Course Code']} 
                userId={currentUser.id} 
                onReviewSubmitted={() => {
                  fetchReviews();
                  refreshCourses();
                }} 
              />
            ) : (
              <p style={{ fontSize: '0.88em', color: '#6b7280', margin: '0 0 12px 0' }}>Log in to submit a review.</p>
            )}

            <div className="bc-reviews-list">
              {loadingReviews ? (
                <p style={{ fontSize: '0.88em', color: '#9ca3af' }}>Loading reviews...</p>
              ) : reviews.length === 0 ? (
                <p style={{ fontSize: '0.88em', color: '#9ca3af', fontStyle: 'italic' }}>No reviews yet. Be the first!</p>
              ) : (
                reviews.map(review => (
                  <div key={review.id} className="bc-review-item">
                    <div className="bc-review-header">
                      <StarDisplay rating={review.rating} />
                      <span className="bc-review-date">
                        {new Date(review.created_at).toLocaleDateString('en-CA', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    {review.review_text && (
                      <p className="bc-review-text">{review.review_text}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <span className="bc-toggle">
        {expanded ? 'Show less ▲' : 'Show more ▼'}
      </span>
    </div>
  )
})

function BrowseCoursesView({ courses, loading, error, onBack }) {
  const { session } = useAuth()
  const { refreshCourses } = useCourses()
  const currentUser = session?.user

  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('All')
  const [sortBy, setSortBy] = useState('code')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPage(1)
    }, 250)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const filteredCourses = useMemo(() => {
    let result = (courses || []).filter((course) => {
      const searchLower = debouncedSearch.toLowerCase()
      const code = (course['Course Code'] || '').toLowerCase()
      const name = (course.Name || '').toLowerCase()

      if (searchLower && !code.includes(searchLower) && !name.includes(searchLower)) return false
      if (levelFilter !== 'All') {
        const match = (course['Course Code'] || '').match(/^[a-zA-Z]+(\d)/)
        if (!match || match[1] + '00' !== levelFilter) return false
      }
      return true
    })

    if (sortBy === 'rating') {
      result.sort((a, b) => {
        const rA = a.course_rating_stats?.[0]?.average_rating || 0
        const rB = b.course_rating_stats?.[0]?.average_rating || 0
        return rB - rA
      })
    } else {
      result.sort((a, b) => (a['Course Code'] || '').localeCompare(b['Course Code'] || ''))
    }
    return result
  }, [courses, debouncedSearch, levelFilter, sortBy])

  const visibleCourses = filteredCourses.slice(0, page * PAGE_SIZE)
  const hasMore = page < Math.ceil(filteredCourses.length / PAGE_SIZE)

  return (
    <div className="bc-container">
      <div className="bc-header">
        <div className="bc-header-left">
          <button className="bc-back" onClick={onBack}>← Back</button>
          <h1 className="bc-title">All Courses</h1>
        </div>
      </div>

      <div className="bc-content">
        <div className="bc-controls">
          <input
            type="text"
            placeholder="Search code or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bc-search-input"
          />
          <select value={levelFilter} onChange={(e) => { setLevelFilter(e.target.value); setPage(1); }} className="bc-level-select">
            <option value="All">All Levels</option>
            <option value="100">100 Level</option>
            <option value="200">200 Level</option>
            <option value="300">300 Level</option>
            <option value="400">400 Level</option>
          </select>
          <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }} className="bc-level-select">
            <option value="code">Sort by Code</option>
            <option value="rating">Sort by Rating</option>
          </select>
        </div>

        {loading && page === 1 ? (
          <div className="bc-status"><div className="bc-spinner"></div><p>Loading courses...</p></div>
        ) : error ? (
          <div className="bc-status"><div className="bc-error">Error: {error}</div></div>
        ) : visibleCourses.length === 0 ? (
          <div className="bc-status"><p>No courses found matching your criteria.</p></div>
        ) : (
          <>
            <div className="bc-grid">
              {visibleCourses.map((c, i) => (
                <CourseCard 
                  key={c['Course Code'] || i} 
                  course={c} 
                  currentUser={currentUser} 
                  refreshCourses={refreshCourses} 
                />
              ))}
            </div>
            {hasMore && (
              <div className="bc-load-more-wrapper">
                <button className="bc-load-more" onClick={() => setPage(p => p + 1)}>Load More</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default BrowseCoursesView