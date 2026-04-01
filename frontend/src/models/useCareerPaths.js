import { useState, useEffect } from 'react'
import jobPaths from '../data/jobPaths'
import supabase from '../supabaseClient'
import useAuth from './useAuth'

function useCareerPaths() {
  const { session } = useAuth()
  const userId = session?.user?.id

  const [savedPaths, setSavedPaths] = useState([])
  const [showExplore, setShowExplore] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(false)

  const allCareers = Object.keys(jobPaths)

  useEffect(() => {
    if (!userId) { setSavedPaths([]); return }
    const fetchPaths = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('user_saved_paths')
        .select('career_path')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
      if (!error) setSavedPaths((data ?? []).map(r => r.career_path))
      setLoading(false)
    }
    fetchPaths()
  }, [userId])

  const handleAddPath = async (careerName) => {
    if (savedPaths.includes(careerName)) { setShowExplore(false); return }
    setSavedPaths(prev => [...prev, careerName])
    setShowExplore(false)
    if (userId) {
      await supabase.from('user_saved_paths').insert({ user_id: userId, career_path: careerName })
    }
  }

  const handleRemovePath = async (careerName) => {
    setSavedPaths(prev => prev.filter(p => p !== careerName))
    if (userId) {
      await supabase.from('user_saved_paths').delete().eq('user_id', userId).eq('career_path', careerName)
    }
  }

  const toggleExplore = () => setShowExplore(!showExplore)
  const closeExplore = () => setShowExplore(false)
  const toggleEditMode = () => setEditMode(prev => !prev)

  return {
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
  }
}

export default useCareerPaths
