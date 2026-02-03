import useCareerPaths from '../models/useCareerPaths'
import CareerPathsView from '../views/CareerPathsView'

function CareerPathsController({ onBack, onOpenRoadmap }) {
  const {
    savedPaths,
    showExplore,
    allCareers,
    handleAddPath,
    toggleExplore,
    closeExplore
  } = useCareerPaths()

  return (
    <CareerPathsView
      savedPaths={savedPaths}
      showExplore={showExplore}
      allCareers={allCareers}
      onBack={onBack}
      onOpenRoadmap={onOpenRoadmap}
      onAddPath={handleAddPath}
      onToggleExplore={toggleExplore}
      onCloseExplore={closeExplore}
    />
  )
}

export default CareerPathsController
