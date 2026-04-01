import useCareerPaths from '../models/useCareerPaths'
import CareerPathsView from '../views/CareerPathsView'

function CareerPathsController({ onBack, onOpenRoadmap }) {
  const {
    savedPaths,
    showExplore,
    editMode,
    loading,
    allCareers,
    handleAddPath,
    handleRemovePath,
    toggleExplore,
    closeExplore,
    toggleEditMode,
  } = useCareerPaths()

  return (
    <CareerPathsView
      savedPaths={savedPaths}
      showExplore={showExplore}
      editMode={editMode}
      loading={loading}
      allCareers={allCareers}
      onBack={onBack}
      onOpenRoadmap={onOpenRoadmap}
      onAddPath={handleAddPath}
      onRemovePath={handleRemovePath}
      onToggleExplore={toggleExplore}
      onCloseExplore={closeExplore}
      onToggleEditMode={toggleEditMode}
    />
  )
}

export default CareerPathsController
