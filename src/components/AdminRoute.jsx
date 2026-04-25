import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../../firebase'
import { doc, getDoc } from 'firebase/firestore'

/**
 * AdminRoute — wraps any component that requires admin privileges.
 *
 * To grant admin access, set  `role: "admin"`  on the user's document in
 * Firestore:  users/{uid}.role = "admin"
 * (Firebase Console → Firestore → users collection → select doc → add field)
 */
export default function AdminRoute({ children }) {
    const { currentUser, isAuthenticated, loading } = useAuth()
    const [isAdmin, setIsAdmin] = useState(null) // null = still checking

    useEffect(() => {
        if (!currentUser || !db) {
            setIsAdmin(false)
            return
        }
        getDoc(doc(db, 'users', currentUser.uid))
            .then((snap) => setIsAdmin(snap.data()?.role === 'admin'))
            .catch(() => setIsAdmin(false))
    }, [currentUser])

    // Auth still loading
    if (loading || isAdmin === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#db2b2b]" />
                    <p className="mt-3 text-slate-400 text-sm">Verifying admin access…</p>
                </div>
            </div>
        )
    }

    if (!isAuthenticated) return <Navigate to="/login" replace />
    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
                <div className="text-center">
                    <p className="text-5xl mb-3">🚫</p>
                    <h2 className="text-xl font-bold mb-1">Access Denied</h2>
                    <p className="text-slate-400 text-sm mb-5">You don't have admin privileges.</p>
                    <a href="/" className="text-[#db2b2b] hover:underline text-sm font-semibold">
                        ← Back to App
                    </a>
                </div>
            </div>
        )
    }

    return children
}
