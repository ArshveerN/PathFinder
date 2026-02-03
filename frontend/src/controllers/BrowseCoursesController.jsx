import useBrowseCourses from '../models/useBrowseCourses'
import BrowseCoursesView from '../views/BrowseCoursesView'

function BrowseCoursesController({ onBack }) {
  const { courses, loading, error } = useBrowseCourses()

  return (
    <BrowseCoursesView
      courses={courses}
      loading={loading}
      error={error}
      onBack={onBack}
    />
  )
}

export default BrowseCoursesController
