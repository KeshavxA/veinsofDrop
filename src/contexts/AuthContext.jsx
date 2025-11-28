import React, { createContext, useContext, useEffect, useState } from 'react'
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut
} from 'firebase/auth'
import { auth } from '../firebase'

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
    // Set up auth state listener
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

    // Cleanup subscription on unmount
    return () => unsubscribe()
  }, [])

  const signOut = async () => {
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

