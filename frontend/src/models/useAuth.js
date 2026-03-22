import { useState, useEffect } from 'react'
import supabase from '../supabaseClient'

function useAuth() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email, password) => {
    setAuthError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setAuthError(error.message)
    return !error
  }

  const signup = async (email, password) => {
    setAuthError(null)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setAuthError(error.message)
    return !error
  }

  const logout = async () => {
    await supabase.auth.signOut()
  }

  return { session, loading, authError, login, signup, logout }
}

export default useAuth
