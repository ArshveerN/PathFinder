import { useState, useEffect, useCallback } from 'react'
import supabase from '../supabaseClient'
import useAuth from './useAuth'

function getVoteHistory() {
  try {
    return JSON.parse(localStorage.getItem('qanda_votes') || '{}')
  } catch { return {} }
}

function saveVoteHistory(history) {
  localStorage.setItem('qanda_votes', JSON.stringify(history))
}

function getAnswerVoteHistory() {
  try {
    return JSON.parse(localStorage.getItem('qanda_answer_votes') || '{}')
  } catch { return {} }
}

function saveAnswerVoteHistory(history) {
  localStorage.setItem('qanda_answer_votes', JSON.stringify(history))
}

function useQandA() {
  const { session } = useAuth()
  const userId = session?.user?.id ?? null

  const [name, setName] = useState('')
  const [question, setQuestion] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)
  const [error, setError] = useState(null)
  const [posts, setPosts] = useState([])
  const [loadingPosts, setLoadingPosts] = useState(false)

  // Answers state
  const [expandedPostId, setExpandedPostId] = useState(null)
  const [answers, setAnswers] = useState({})
  const [loadingAnswers, setLoadingAnswers] = useState({})
  const [answerName, setAnswerName] = useState('')
  const [answerText, setAnswerText] = useState('')
  const [submittingAnswer, setSubmittingAnswer] = useState(false)

  // Vote state
  const [voteHistory, setVoteHistory] = useState(getVoteHistory)
  const [answerVoteHistory, setAnswerVoteHistory] = useState(getAnswerVoteHistory)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      setLoadingPosts(true)
      const [{ data: postsData, error: postsError }, { data: answerCounts }] = await Promise.all([
        supabase.from('Pending Questions').select('*').order('Votes', { ascending: false }),
        supabase.from('Answers').select('question_id'),
      ])
      if (postsError) throw postsError
      // Build a count map: question_id → number of answers
      const countMap = {}
      ;(answerCounts ?? []).forEach(({ question_id }) => {
        countMap[question_id] = (countMap[question_id] || 0) + 1
      })
      setPosts((postsData ?? []).map(p => ({
        ...p,
        _answerCount: countMap[p.Id ?? p.id] || 0,
      })))
    } catch (err) {
      console.error('Failed to fetch posts:', err.message)
    } finally {
      setLoadingPosts(false)
    }
  }

  /* ── Voting ── */
  const handleVote = async (postId, direction) => {
    const currentVote = voteHistory[postId] || null
    const post = posts.find(p => (p.Id ?? p.id) === postId)
    if (!post) return

    let delta = 0
    let newVote = null

    if (direction === 'up') {
      if (currentVote === 'up') { delta = -1; newVote = null }
      else if (currentVote === 'down') { delta = 2; newVote = 'up' }
      else { delta = 1; newVote = 'up' }
    } else {
      if (currentVote === 'down') { delta = 1; newVote = null }
      else if (currentVote === 'up') { delta = -2; newVote = 'down' }
      else { delta = -1; newVote = 'down' }
    }

    const idField = post.Id !== undefined ? 'Id' : 'id'
    const currentVotes = post.Votes ?? post.votes ?? 0
    const newVotes = currentVotes + delta

    // Save old history so we can roll back on failure
    const oldHistory = { ...voteHistory }
    const newHistory = { ...voteHistory }
    if (newVote) newHistory[postId] = newVote
    else delete newHistory[postId]

    // Optimistic update — also re-sort by votes
    setPosts(prev => {
      const updated = prev.map(p =>
        (p.Id ?? p.id) === postId ? { ...p, Votes: newVotes } : p
      )
      return [...updated].sort((a, b) => ((b.Votes ?? b.votes ?? 0) - (a.Votes ?? a.votes ?? 0)))
    })
    setVoteHistory(newHistory)
    saveVoteHistory(newHistory)

    try {
      const { error } = await supabase
        .from('Pending Questions')
        .update({ Votes: newVotes })
        .eq(idField, postId)
      if (error) throw error
    } catch (err) {
      // Roll back everything including localStorage
      setPosts(prev => {
        const reverted = prev.map(p =>
          (p.Id ?? p.id) === postId ? { ...p, Votes: currentVotes } : p
        )
        return [...reverted].sort((a, b) => ((b.Votes ?? b.votes ?? 0) - (a.Votes ?? a.votes ?? 0)))
      })
      setVoteHistory(oldHistory)
      saveVoteHistory(oldHistory)
      setError('Vote failed: ' + (err.message || 'permission denied. Check Supabase RLS policies.'))
    }
  }

  /* ── Answers ── */
  const fetchAnswers = async (postId) => {
    try {
      setLoadingAnswers(prev => ({ ...prev, [postId]: true }))
      const { data, error } = await supabase
        .from('Answers')
        .select('*')
        .eq('question_id', postId)
        .order('Votes', { ascending: false })
      if (error) throw error
      setAnswers(prev => ({ ...prev, [postId]: data ?? [] }))
    } catch (err) {
      console.error('Failed to fetch answers:', err.message)
      setAnswers(prev => ({ ...prev, [postId]: [] }))
    } finally {
      setLoadingAnswers(prev => ({ ...prev, [postId]: false }))
    }
  }

  const toggleExpand = useCallback((postId) => {
    setExpandedPostId(prev => {
      const next = prev === postId ? null : postId
      if (next && !answers[next]) fetchAnswers(next)
      return next
    })
    setAnswerName('')
    setAnswerText('')
  }, [answers])

  const submitAnswer = async (postId) => {
    if (!answerName.trim() || !answerText.trim()) {
      setError('Please fill in both name and answer.')
      return
    }
    try {
      setSubmittingAnswer(true)
      setError(null)
      const { error: sbError } = await supabase
        .from('Answers')
        .insert([{
          question_id: postId,
          Name: answerName.trim(),
          Answer: answerText.trim(),
          Time: new Date().toTimeString().split(' ')[0],
          Data: new Date().toISOString().split('T')[0],
          Votes: 0,
          user_id: userId,
        }])
      if (sbError) throw sbError
      setAnswerName('')
      setAnswerText('')
      fetchAnswers(postId)
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setSubmittingAnswer(false)
    }
  }

  /* ── Groq AI suggestion ── */
  const getAiAnswer = async (questionText) => {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY
    if (!apiKey || apiKey === 'your_groq_api_key_here') return null

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a knowledgeable academic advisor at the University of Toronto Mississauga (UTM). Answer the student\'s question directly using your knowledge of UTM courses, programs, and prerequisites. Then add one short sentence on where they can confirm or find more details. Be concise.',
          },
          {
            role: 'user',
            content: questionText,
          },
        ],
        max_tokens: 120,
        temperature: 0.5,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Groq API error:', response.status, errText)
      return null
    }
    const data = await response.json()
    return data.choices?.[0]?.message?.content?.trim() || null
  }

  /* ── Post question ── */
  const handleSubmit = async () => {
    if (!name.trim() || !question.trim()) {
      setError('Please fill in both your name and your question.')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const aiAnswer = await getAiAnswer(question.trim())

      const { error: supabaseError } = await supabase
        .from('Pending Questions')
        .insert([{
          Name: name.trim(),
          Question: question.trim(),
          Time: new Date().toTimeString().split(' ')[0],
          Data: new Date().toISOString().split('T')[0],
          Votes: 0,
          ai_answer: aiAnswer,
          user_id: userId,
        }])

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

  /* ── Answer Voting ── */
  const handleAnswerVote = async (answerId, questionId, direction) => {
    const postAnswers = answers[questionId] || []
    const answer = postAnswers.find(a => (a.Id ?? a.id) === answerId)
    if (!answer) return

    const currentVote = answerVoteHistory[answerId] || null
    let delta = 0
    let newVote = null

    if (direction === 'up') {
      if (currentVote === 'up') { delta = -1; newVote = null }
      else if (currentVote === 'down') { delta = 2; newVote = 'up' }
      else { delta = 1; newVote = 'up' }
    } else {
      if (currentVote === 'down') { delta = 1; newVote = null }
      else if (currentVote === 'up') { delta = -2; newVote = 'down' }
      else { delta = -1; newVote = 'down' }
    }

    const idField = answer.Id !== undefined ? 'Id' : 'id'
    const currentVotes = answer.Votes ?? answer.votes ?? 0
    const newVotes = currentVotes + delta

    // Save old history so we can roll back on failure
    const oldHistory = { ...answerVoteHistory }
    const newHistory = { ...answerVoteHistory }
    if (newVote) newHistory[answerId] = newVote
    else delete newHistory[answerId]

    // Optimistic update — also re-sort answers by votes
    setAnswers(prev => ({
      ...prev,
      [questionId]: [...(prev[questionId] || []).map(a =>
        (a.Id ?? a.id) === answerId ? { ...a, Votes: newVotes } : a
      )].sort((a, b) => ((b.Votes ?? b.votes ?? 0) - (a.Votes ?? a.votes ?? 0))),
    }))
    setAnswerVoteHistory(newHistory)
    saveAnswerVoteHistory(newHistory)

    try {
      const { error } = await supabase
        .from('Answers')
        .update({ Votes: newVotes })
        .eq(idField, answerId)
      if (error) throw error
    } catch (err) {
      // Roll back everything including localStorage
      setAnswers(prev => ({
        ...prev,
        [questionId]: [...(prev[questionId] || []).map(a =>
          (a.Id ?? a.id) === answerId ? { ...a, Votes: currentVotes } : a
        )].sort((a, b) => ((b.Votes ?? b.votes ?? 0) - (a.Votes ?? a.votes ?? 0))),
      }))
      setAnswerVoteHistory(oldHistory)
      saveAnswerVoteHistory(oldHistory)
      setError('Vote failed: ' + (err.message || 'permission denied. Check Supabase RLS policies.'))
    }
  }

  /* ── Delete question (and its answers) ── */
  const deleteQuestion = async (postId) => {
    try {
      await supabase.from('Answers').delete().eq('question_id', postId)
      const { error } = await supabase.from('Pending Questions').delete().eq('Id', postId)
      if (error) throw error
      setPosts(prev => prev.filter(p => (p.Id ?? p.id) !== postId))
      if (expandedPostId === postId) setExpandedPostId(null)
    } catch (err) {
      setError(err.message || String(err))
    }
  }

  /* ── Delete answer ── */
  const deleteAnswer = async (answerId, questionId) => {
    try {
      const { error } = await supabase.from('Answers').delete().eq('id', answerId)
      if (error) throw error
      setAnswers(prev => ({
        ...prev,
        [questionId]: (prev[questionId] || []).filter(a => (a.Id ?? a.id) !== answerId),
      }))
      setPosts(prev => prev.map(p =>
        (p.Id ?? p.id) === questionId ? { ...p, _answerCount: Math.max(0, (p._answerCount || 1) - 1) } : p
      ))
    } catch (err) {
      setError(err.message || String(err))
    }
  }

  const clearSuccess = () => setSuccessMessage(null)
  const clearError = () => setError(null)

  return {
    name, question, submitting, successMessage, error,
    posts, loadingPosts,
    expandedPostId, answers, loadingAnswers,
    answerName, answerText, submittingAnswer,
    voteHistory, answerVoteHistory,
    userId,
    setName, setQuestion, setAnswerName, setAnswerText,
    handleSubmit, handleVote, handleAnswerVote, toggleExpand, submitAnswer,
    deleteQuestion, deleteAnswer,
    clearSuccess, clearError,
  }
}

export default useQandA
