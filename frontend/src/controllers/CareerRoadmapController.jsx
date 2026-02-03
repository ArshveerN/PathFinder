import useCareerRoadmap from '../models/useCareerRoadmap'
import CareerRoadmapView from '../views/CareerRoadmapView'

function CareerRoadmapController({ career, onBack }) {
  const { coursesWithRequirements } = useCareerRoadmap(career)

  return (
    <CareerRoadmapView
      career={career}
      coursesWithRequirements={coursesWithRequirements}
      onBack={onBack}
    />
  )
}

export default CareerRoadmapController
