import jobPaths from '../data/jobPaths'
import graph from '../prerequisiteGraph'

function useCareerRoadmap(career) {
  const pathCourses = jobPaths[career] || []

  const getRequirementsData = () => {
    return pathCourses.map((courseCode) => {
      const requirements = graph.getTypedRequirements(courseCode)
      return {
        courseCode,
        requirements: requirements.map((req) => ({
          ...req,
          inPath: pathCourses.includes(req.code)
        }))
      }
    })
  }

  return {
    pathCourses,
    coursesWithRequirements: getRequirementsData()
  }
}

export default useCareerRoadmap
