import { useState, useEffect } from 'react'; // INSERTION: React hooks
import jobPaths from '../data/jobPaths';
import graph from '../prerequisiteGraph';

function useCareerRoadmap(career) {
  const [loading, setLoading] = useState(true); // INSERTION: Loading state
  const [coursesWithRequirements, setCoursesWithRequirements] = useState([]); // INSERTION: State for processed courses
  const pathCourses = jobPaths[career] || [];

  const getCourseDetails = (courseCode) => {
    const requirements = graph.getTypedRequirements(courseCode);
    const nodeInfo = graph.nodes.get(courseCode);
    
    return {
      courseCode,
      name: nodeInfo?.name || '',
      description: nodeInfo?.description || '',
      requirements: requirements.map((req) => ({
        ...req,
        inPath: pathCourses.includes(req.code)
      }))
    };
  };

  // INSERTION: Effect to initialize graph and load data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        await graph.initialize(); // Trigger Supabase fetch
        const data = pathCourses.map((courseCode) => getCourseDetails(courseCode));
        setCoursesWithRequirements(data);
      } catch (err) {
        console.error("Error loading roadmap:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [career]);

  return {
    pathCourses,
    coursesWithRequirements, // MODIFICATION: Now returns the stateful data
    getCourseDetails,
    loading // INSERTION: Return loading state
  };
}

export default useCareerRoadmap;