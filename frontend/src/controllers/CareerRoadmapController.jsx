import useCareerRoadmap from '../models/useCareerRoadmap'
import CareerRoadmapView from '../views/CareerRoadmapView'

function CareerRoadmapController({ career, onBack }) {
  const { coursesWithRequirements, getCourseDetails } = useCareerRoadmap(career)

  return (
    <CareerRoadmapView
      career={career}
      coursesWithRequirements={coursesWithRequirements}
      getCourseDetails={getCourseDetails}
      onBack={onBack}
    />
  )
}

export default CareerRoadmapController