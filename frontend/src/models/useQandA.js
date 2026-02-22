import { useState, useEffect } from 'react'
import supabase from '../supabaseClient'

function useQandA() {
  const [name, setName] = useState('')
  const [question, setQuestion] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)
  const [error, setError] = useState(null)
  const [posts, setPosts] = useState([])
  const [loadingPosts, setLoadingPosts] = useState(false)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      setLoadingPosts(true)
      const { data, error } = await supabase
        .from('Pending Questions')
        .select('*')
        .order('Id', { ascending: false })
      if (error) throw error
      setPosts(data ?? [])
    } catch (err) {
      console.error('Failed to fetch posts:', err.message)
    } finally {
      setLoadingPosts(false)
    }
  }

  const handleSubmit = async () => {
    if (!name.trim() || !question.trim()) {
      setError('Please fill in both your name and your question.')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const { error: supabaseError } = await supabase
        .from('Pending Questions')
        .insert([
          {
            Name: name.trim(),
            Question: question.trim(),
            Time: new Date().toTimeString().split(' ')[0],
            Data: new Date().toISOString().split('T')[0],
          }
        ])

      if (supabaseError) throw supabaseError

      setSuccessMessage('Question posted!')
      setName('')
      setQuestion('')
      fetchPosts()
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setSubmitting(false)
    }
  }

  const clearSuccess = () => setSuccessMessage(null)
  const clearError = () => setError(null)

  return {
    name,
    question,
    submitting,
    successMessage,
    error,
    posts,
    loadingPosts,
    setName,
    setQuestion,
    handleSubmit,
    clearSuccess,
    clearError,
  }
}

export default useQandA
