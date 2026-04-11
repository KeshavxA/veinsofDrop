import React, { createContext, useContext, useEffect, useState } from 'react'
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut
} from 'firebase/auth'
import { auth } from '../../firebase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!auth) {
      const configError = new Error('Firebase not configured. Please update firebase.js with your Firebase credentials from Firebase Console.')
      setError(configError)
      setLoading(false)
      return
    }

    try {
      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          setCurrentUser(user)
          setLoading(false)
          setError(null)
        },
        (error) => {
          console.error('Auth state change error:', error)
          setError(error)
          setLoading(false)
        }
      )
      return () => unsubscribe()
    } catch (error) {
      console.error('Error setting up auth listener:', error)
      setError(error)
      setLoading(false)
    }
  }, [])

  const signOut = async () => {
    if (!auth) {
      return { success: false, error: 'Firebase not configured' }
    }
    try {
      await firebaseSignOut(auth)
      setCurrentUser(null)
      return { success: true }
    } catch (error) {
      console.error('Sign out error:', error)
      return { success: false, error: error.message }
    }
  }

  const value = {
    currentUser,
    loading,
    error,
    signOut,
    isAuthenticated: !!currentUser
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
      {loading && (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafa]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#db2b2b]"></div>
            <p className="mt-4 text-[#142323]">Loading...</p>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  )
}

