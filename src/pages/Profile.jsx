import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../../firebase'
import { doc, setDoc, getDoc, addDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore'

function Profile() {
  const { currentUser, signOut } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [verificationStatus, setVerificationStatus] = useState(null) // null | 'pending' | 'verified'
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [verifyMsg, setVerifyMsg] = useState('')
  const [myRequests, setMyRequests] = useState([])
  const [loadingRequests, setLoadingRequests] = useState(false)
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    bloodType: '',
    location: ''
  })

  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser) {
        navigate('/login')
        return
      }

      if (!db) {
        setError('Firestore database is not initialized. Please configure Firebase.')
        setLoadingProfile(false)
        return
      }

      try {
        const profileRef = doc(db, 'users', currentUser.uid)
        const profileSnap = await getDoc(profileRef)
        if (profileSnap.exists()) setProfileData(profileSnap.data())

        // Check donor verified status
        const donorQ = query(collection(db, 'donors'), where('userId', '==', currentUser.uid))
        const donorSnap = await getDocs(donorQ)
        if (!donorSnap.empty) {
          const donorData = donorSnap.docs[0].data()
          setVerificationStatus(donorData.verified ? 'verified' : 'unverified')
        }

        // Check if there is already a pending verification request
        const verQ = query(
          collection(db, 'verificationRequests'),
          where('userId', '==', currentUser.uid),
          where('status', '==', 'pending')
        )
        const verSnap = await getDocs(verQ)
        if (!verSnap.empty) setVerificationStatus('pending')

        // Load user's own blood requests
        setLoadingRequests(true)
        const reqQ = query(collection(db, 'requests'), where('userId', '==', currentUser.uid))
        const reqSnap = await getDocs(reqQ)
        const reqs = reqSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const ta = a.createdAt?.toDate?.()?.getTime() ?? 0
            const tb = b.createdAt?.toDate?.()?.getTime() ?? 0
            return tb - ta
          })
        setMyRequests(reqs)
        setLoadingRequests(false)
      } catch (err) {
        console.error('Error loading profile:', err)
        setError('Failed to load profile data')
      } finally {
        setLoadingProfile(false)
      }
    }

    loadProfile()
  }, [currentUser, navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (!currentUser) {
        throw new Error('User not authenticated')
      }

      if (!db) {
        throw new Error('Firestore database is not initialized. Please configure Firebase.')
      }

      const profileRef = doc(db, 'users', currentUser.uid)
      await setDoc(profileRef, {
        ...profileData,
        email: currentUser.email,
        updatedAt: new Date().toISOString()
      }, { merge: true })

      setSuccess('Profile updated successfully!')
    } catch (err) {
      console.error('Error updating profile:', err)
      setError(err.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    const result = await signOut()
    if (result.success) {
      navigate('/login')
    }
  }

  const handleRequestVerification = async () => {
    if (!currentUser || !db) return
    setVerifyLoading(true)
    setVerifyMsg('')
    try {
      await addDoc(collection(db, 'verificationRequests'), {
        userId: currentUser.uid,
        email: currentUser.email,
        name: profileData.name || '',
        phone: profileData.phone || '',
        bloodType: profileData.bloodType || '',
        status: 'pending',   // admin sets to 'approved' or 'rejected'
        createdAt: serverTimestamp(),
      })
      setVerificationStatus('pending')
      setVerifyMsg('Verification request submitted! Our team will review within 24\u00a0hours.')
    } catch (err) {
      console.error('Verification request error:', err)
      setVerifyMsg('Failed to submit. Please try again.')
    } finally {
      setVerifyLoading(false)
    }
  }

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e6fffb]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#db2b2b]"></div>
          <p className="mt-4 text-[#142323]">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#e6fffb]">
      <header className="bg-gradient-to-r from-[rgb(191,203,203)] to-[rgb(219,43,43)] text-white">
        <div className="max-w-[1400px] mx-auto px-4 flex items-center justify-between py-3">
          <Link to="/" className="flex items-center gap-3">
            <img src="/assets/logo.png" alt="veinsofDrop logo" className="h-11 w-auto block rounded-md" />
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg bg-white text-[#db2b2b] font-semibold shadow-md hover:shadow-lg transition-transform transform hover:-translate-y-0.5"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 py-10">
        <div className="bg-white/60 p-7 rounded-lg shadow-sm">
          <h2 className="text-2xl font-bold text-[#142323] mb-6">Profile Settings</h2>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={currentUser?.email || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                value={profileData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#db2b2b] focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={profileData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#db2b2b] focus:border-transparent"
                placeholder="Enter your phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type</label>
              <select
                name="bloodType"
                value={profileData.bloodType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#db2b2b] focus:border-transparent"
              >
                <option value="">Select blood type</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                name="location"
                value={profileData.location}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#db2b2b] focus:border-transparent"
                placeholder="Enter your city"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-[#db2b2b] text-white rounded-lg font-semibold hover:bg-[#c02525] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
              <Link
                to="/"
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>

          {/* ── Donor Verification Card ───────────────────────────────────────── */}
          <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50/60 p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-blue-600 text-xl">🛡️</span>
              <h3 className="text-base font-bold text-blue-900">Donor Verification</h3>
            </div>

            {verificationStatus === 'verified' && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 bg-blue-100 border border-blue-300 px-3 py-1.5 rounded-full">
                  ✓ Verified Donor
                </span>
                <span className="text-xs text-gray-500">Your profile has been verified by our team.</span>
              </div>
            )}

            {verificationStatus === 'pending' && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-full">
                  ⏳ Verification Pending
                </span>
                <span className="text-xs text-gray-500">We are reviewing your request. Usually within 24 hours.</span>
              </div>
            )}

            {(verificationStatus === 'unverified' || verificationStatus === null) && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Get a <strong>✓ Verified</strong> badge on your donor profile. Our team will confirm your identity and blood type before approving.
                </p>
                <button
                  type="button"
                  onClick={handleRequestVerification}
                  disabled={verifyLoading}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                >
                  {verifyLoading ? 'Submitting…' : 'Request Verification Badge'}
                </button>
              </div>
            )}

            {verifyMsg && (
              <p className={`mt-3 text-sm font-medium ${verifyMsg.includes('Failed') ? 'text-red-600' : 'text-green-700'
                }`}>{verifyMsg}</p>
            )}
          </div>

          {/* ── My Blood Requests ─────────────────────────────────────────── */}
          <div className="mt-8 rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100">
              <span className="text-base">🩸</span>
              <h3 className="text-base font-bold text-gray-800">My Blood Requests</h3>
              {myRequests.length > 0 && (
                <span className="ml-auto text-xs font-semibold text-[#db2b2b] bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                  {myRequests.length}
                </span>
              )}
            </div>

            {loadingRequests ? (
              <p className="text-center text-sm text-gray-400 py-8">Loading…</p>
            ) : myRequests.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-3xl mb-2">📋</p>
                <p className="text-sm text-gray-500">You haven't submitted any blood requests yet.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {myRequests.map((req) => {
                  const statusColors = {
                    pending: 'bg-gray-100 text-gray-600',
                    contacted: 'bg-blue-100 text-blue-700',
                    accepted: 'bg-emerald-100 text-emerald-700',
                    fulfilled: 'bg-red-100 text-red-700',
                  }
                  const dateStr = req.createdAt?.toDate?.()?.toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  }) ?? '—'
                  return (
                    <li key={req.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#db2b2b]">{req.bloodGroup || '?'}</span>
                          <span className="text-xs text-gray-500">·</span>
                          <span className="text-sm text-gray-700 truncate max-w-[200px]">{req.hospitalLocation || '—'}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{dateStr} · {req.unitsRequired || '?'} unit(s)</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[req.status] || statusColors.pending}`}>
                          {(req.status || 'pending').charAt(0).toUpperCase() + (req.status || 'pending').slice(1)}
                        </span>
                        <Link
                          to={`/request/${req.id}`}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#db2b2b] text-[#db2b2b] hover:bg-red-50 transition-colors"
                        >
                          View →
                        </Link>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-[#f1f7f7] py-4 mt-8 border-t border-black/5">
        <div className="max-w-[1400px] mx-auto px-4 text-[#053c3c] text-center">
          <p>&copy; <span>{new Date().getFullYear()}</span> Footer</p>
        </div>
      </footer>
    </div>
  )
}

export default Profile
