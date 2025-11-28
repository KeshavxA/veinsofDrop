import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../firebase'
import { doc, setDoc, getDoc } from 'firebase/firestore'

function Profile() {
  const { currentUser, signOut } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
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

      try {
        const profileRef = doc(db, 'users', currentUser.uid)
        const profileSnap = await getDoc(profileRef)
        
        if (profileSnap.exists()) {
          setProfileData(profileSnap.data())
        }
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
