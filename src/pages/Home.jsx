import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../../firebase'
import { collection, addDoc, onSnapshot, doc, getDoc, query, orderBy } from 'firebase/firestore'
import {
  donorCanHelpRecipient,
  normalizeBloodType,
} from '../utils/bloodCompatibility'
import NotificationBell from '../components/NotificationBell'
import ReportModal from '../components/ReportModal'
import { checkRateLimit, timeUntil } from '../utils/rateLimiter'

function Home() {
  const { currentUser, signOut, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDonorPopup, setShowDonorPopup] = useState(false)
  const [showRequestPopup, setShowRequestPopup] = useState(false)

  const [donorName, setDonorName] = useState("")
  const [donorEmail, setDonorEmail] = useState(currentUser?.email || "")
  const [donorPhone, setDonorPhone] = useState("")
  const [donorBloodGroup, setDonorBloodGroup] = useState("")
  const [donorLocation, setDonorLocation] = useState("")
  const [donorAvailableQuantity, setAvailableQuantity] = useState(0)

  const [patientName, setPatientName] = useState("")
  const [bloodGroup, setBloodGroup] = useState("")
  const [requestEmail, setRequestEmail] = useState(currentUser?.email || "")
  const [requestPhone, setRequestPhone] = useState("")
  const [unitsRequired, setUnitsRequired] = useState("")
  const [emergencyLevel, setEmergencyLevel] = useState("normal")
  const [hospitalLocation, setHospitalLocation] = useState("")

  const [recipientBloodFilter, setRecipientBloodFilter] = useState("")
  const [urgentRequests, setUrgentRequests] = useState([])
  const [onlyCompatible, setOnlyCompatible] = useState(true)

  const [searchQuery, setSearchQuery] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [donorBloodFilter, setDonorBloodFilter] = useState('')
  const [minUnitsFilter, setMinUnitsFilter] = useState('')
  const [sortMode, setSortMode] = useState('same_city')
  const [currentUserProfile, setCurrentUserProfile] = useState(null)
  const [reportTarget, setReportTarget] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const asDate = (value) => {
    if (!value) return null
    if (typeof value?.toDate === 'function') return value.toDate()
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }

  const normText = (v) => (v == null ? '' : String(v)).trim().toLowerCase()

  const fetchCurrentUserProfile = async () => {
    if (!db || !currentUser?.uid) return
    try {
      const snap = await getDoc(doc(db, 'users', currentUser.uid))
      if (snap.exists()) setCurrentUserProfile(snap.data())
    } catch (e) {
      console.error('Error fetching user profile:', e)
    }
  }

  useEffect(() => {
    if (!isAuthenticated || !db) return

    if (currentUser?.email) {
      setDonorEmail(currentUser.email)
      setRequestEmail(currentUser.email)
    }
    fetchCurrentUserProfile()

    // Check admin role
    if (currentUser?.uid && db) {
      getDoc(doc(db, 'users', currentUser.uid)).then((snap) => {
        setIsAdmin(snap.data()?.role === 'admin')
      }).catch(() => { })
    }

    const donorsUnsub = onSnapshot(
      collection(db, 'donors'),
      (snap) => {
        // Filter out blocked donors on the client side
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((d) => !d.blocked)
        setDonors(list)
        setLoading(false)
      },
      (err) => {
        console.error('donors onSnapshot error:', err)
        setLoading(false)
      }
    )

    const reqQ = query(collection(db, 'requests'), orderBy('createdAt', 'desc'))
    const reqUnsub = onSnapshot(
      reqQ,
      (snap) => {
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        const urgent = all
          .filter(
            (r) =>
              (r.emergencyLevel === 'urgent' || r.emergencyLevel === 'critical') &&
              r.status !== 'fulfilled'
          )
          .slice(0, 6)
        setUrgentRequests(urgent)
      },
      (err) => console.error('requests onSnapshot error:', err)
    )

    return () => {
      donorsUnsub()
      reqUnsub()
    }
  }, [isAuthenticated, currentUser])

  const visibleDonors = donors.filter(d => d.email !== currentUser?.email)

  const recipientType = normalizeBloodType(recipientBloodFilter)
  const userCity = normText(currentUserProfile?.location)

  const filteredDonors = visibleDonors
    .filter((d) => {
      const q = normText(searchQuery)
      if (!q) return true
      const hay = [
        d.name,
        d.email,
        d.phone,
        d.location,
        d.bloodGroup,
      ]
        .map(normText)
        .join(' ')
      return hay.includes(q)
    })
    .filter((d) => {
      const city = normText(cityFilter)
      if (!city) return true
      return normText(d.location) === city
    })
    .filter((d) => {
      const bt = normalizeBloodType(donorBloodFilter)
      if (!bt) return true
      return normalizeBloodType(d.bloodGroup) === bt
    })
    .filter((d) => {
      const min = minUnitsFilter === '' ? null : Number(minUnitsFilter)
      if (min == null || Number.isNaN(min)) return true
      const units = Number(d.availablequantity ?? d.availableQuantity ?? 0)
      return units >= min
    })

  const matchedDonors =
    onlyCompatible && recipientType
      ? filteredDonors.filter((d) =>
        donorCanHelpRecipient(d.bloodGroup, recipientType)
      )
      : filteredDonors

  const sortedDonors = [...matchedDonors].sort((a, b) => {
    const unitsA = Number(a.availablequantity ?? a.availableQuantity ?? 0)
    const unitsB = Number(b.availablequantity ?? b.availableQuantity ?? 0)
    const lastA = asDate(a.lastActiveAt) ?? asDate(a.createdAt) ?? new Date(0)
    const lastB = asDate(b.lastActiveAt) ?? asDate(b.createdAt) ?? new Date(0)

    if (sortMode === 'units_desc') return unitsB - unitsA
    if (sortMode === 'last_active') return lastB - lastA

    if (sortMode === 'same_city' && userCity) {
      const aSame = normText(a.location) === userCity ? 0 : 1
      const bSame = normText(b.location) === userCity ? 0 : 1
      if (aSame !== bSame) return aSame - bSame
    }

    return lastB - lastA
  })

  const handleBecomeDonorClick = () => {
    if (!isAuthenticated) {
      alert("Please login first to become a donor.");
      navigate('/login');
      return;
    }

    const isAlreadyDonorByEmail = donors.some(d => d.email === currentUser?.email);

    if (isAlreadyDonorByEmail) {
      alert("You are already registered as a donor with this email.");
    } else {
      setShowDonorPopup(true);
    }
  }
  const handleSendMailToDonor = async (donor) => {
    const subject = `Urgent: Blood Donation Request via veinsofDrop`;
    const body = `Hello ${donor.name},%0D%0A%0D%0AI found your profile on veinsofDrop and I am in need of ${donor.bloodGroup} blood donation.%0D%0A%0D%0ALocation: ${donor.location}%0D%0A%0D%0APlease let me know if you are available to help.%0D%0A%0D%0ARequested by: ${currentUser?.email}`;

    window.location.href = `mailto:${donor.email}?subject=${subject}&body=${body}`;

    if (!db) {
      console.warn("Firestore database is not initialized. Contact request not logged.");
      return;
    }

    try {
      await addDoc(collection(db, "contact_requests"), {
        requesterEmail: currentUser?.email,
        requesterUid: currentUser?.uid,
        donorName: donor.name,
        donorEmail: donor.email,
        donorUid: donor.userId || "unknown",
        requestDate: new Date(),
        status: "initiated"
      });
      console.log("Contact request logged in database.");
    } catch (error) {
      console.error("Error logging contact request:", error);
    }
  };

  const handleLogout = async () => {
    const result = await signOut()
    if (result.success) {
      navigate('/login')
    }
  }

  const handleDonorSubmit = async (e) => {
    e.preventDefault()

    if (!isAuthenticated) {
      alert('Please login first to become a donor.')
      navigate('/login')
      return
    }

    if (donorPhone.length !== 10 || isNaN(donorPhone)) {
      alert('Please enter a valid 10-digit phone number.')
      return
    }

    const duplicateFound = donors.some(
      (d) => d.email === donorEmail || d.phone === donorPhone
    )
    if (duplicateFound) {
      alert('Registration Failed: A donor with this Email or Phone Number already exists.')
      return
    }

    // ── Rate limit: 1 donor registration per user account ─────────────────
    const rl = await checkRateLimit(currentUser?.uid, 'donors', 1, 24 * 365)
    if (!rl.allowed) {
      alert('You have already registered as a donor. Each account may only register once.')
      return
    }

    if (!db) {
      alert('Firestore database is not initialized. Please configure Firebase.')
      return
    }

    try {
      await addDoc(collection(db, 'donors'), {
        name: donorName,
        email: donorEmail,
        phone: donorPhone,
        bloodGroup: donorBloodGroup,
        location: donorLocation,
        availablequantity: donorAvailableQuantity,
        userId: currentUser?.uid || 'anonymous',
        verified: false,          // admin / OTP flow sets this to true
        blocked: false,
        createdAt: new Date(),
      })

      alert('Thank you! You are now registered as a donor.')
      setShowDonorPopup(false)
      setDonorName(''); setDonorPhone(''); setDonorBloodGroup(''); setDonorLocation(''); setAvailableQuantity(0)
    } catch (error) {
      console.error('Error adding donor: ', error)
      alert('Failed to submit. See console for details.')
    }
  }

  const handleRequestClick = () => {
    if (!isAuthenticated) {
      alert("Please login first to request blood.");
      navigate('/login');
      return;
    }
    setShowRequestPopup(true);
  }

  const handleRequestSubmit = async (e) => {
    e.preventDefault()

    if (!isAuthenticated) {
      alert('Please login first to request blood.')
      navigate('/login')
      return
    }

    if (requestPhone.length !== 10 || isNaN(requestPhone)) {
      alert('Please enter a valid 10-digit phone number.')
      return
    }

    // ── Rate limit: max 3 requests per user in 24 hours ────────────────────
    const rl = await checkRateLimit(currentUser?.uid, 'requests', 3, 24)
    if (!rl.allowed) {
      const resetMsg = rl.resetAt ? ` Try again in ${timeUntil(rl.resetAt)}.` : ''
      alert(`Rate limit reached: You can submit up to 3 blood requests per 24 hours.${resetMsg}`)
      return
    }

    if (!db) {
      alert('Firestore database is not initialized. Please configure Firebase.')
      return
    }

    try {
      await addDoc(collection(db, 'requests'), {
        patientName,
        bloodGroup,
        requestEmail,
        requestPhone,
        unitsRequired,
        emergencyLevel,
        hospitalLocation,
        userId: currentUser?.uid || 'anonymous',
        status: 'pending',
        createdAt: new Date(),
      })

      alert('Blood request submitted successfully!')
      setShowRequestPopup(false)
      setPatientName(''); setBloodGroup(''); setRequestPhone(''); setUnitsRequired(''); setHospitalLocation('')
    } catch (error) {
      console.error('Error submitting request: ', error)
      alert('Failed to submit request.')
    }
  }

  return (
    <div className="m-0 p-0 font-sans bg-[#e6fffb] text-[#9ab3b3] leading-relaxed min-h-screen">
      <aside className="fixed top-1/2 left-4 -translate-y-1/2 flex flex-col gap-3 z-50">
      </aside>

      <header className="bg-gradient-to-r from-[rgb(191,203,203)] to-[rgb(219,43,43)] text-white">
        <div className="max-w-[1400px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between py-3 gap-2 sm:gap-0 relative">
          <div className="flex items-center gap-3">
            <img src="/assets/logo.png" alt="veinsofDrop logo" className="h-11 w-auto block rounded-md" />
            <h1 className="m-0 text-xl font-bold"></h1>
          </div>

          <div className="md:hidden flex gap-2">
            <button
              onClick={handleBecomeDonorClick}
              className="text-white hover:text-red-700 font-semibold text-sm px-2 py-1"
              type="button"
            >
              Donor
            </button>
            <button
              onClick={handleRequestClick}
              className="text-white hover:text-red-700 font-semibold text-sm px-2 py-1"
              type="button"
            >
              Request
            </button>
          </div>

          <nav aria-label="Main navigation" className="absolute left-1/2 transform -translate-x-1/2 hidden md:block">
            <ul className="flex gap-4">
              <li>
                <Link
                  to="/"
                  className={`font-semibold transition-colors ${location.pathname === '/'
                    ? 'text-white font-bold'
                    : 'text-gray-100 hover:text-red-700'
                    }`}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/profile"
                  className={`font-semibold transition-colors ${location.pathname === '/profile'
                    ? 'text-white font-bold'
                    : 'text-gray-100 hover:text-red-700'
                    }`}
                >
                  Profile
                </Link>
              </li>
              {isAdmin && (
                <li>
                  <Link
                    to="/admin"
                    className={`font-semibold transition-colors ${location.pathname.startsWith('/admin')
                      ? 'text-white font-bold'
                      : 'text-gray-100 hover:text-red-700'
                      }`}
                  >
                    ⚙ Admin
                  </Link>
                </li>
              )}
              <li>
                <button
                  onClick={handleBecomeDonorClick}
                  className="text-white hover:text-red-700 font-semibold bg-transparent border-none cursor-pointer p-0"
                  type="button"
                >
                  Become a donor
                </button>
              </li>
              <li>
                <button
                  onClick={handleRequestClick}
                  className="text-white hover:text-red-700 font-semibold bg-transparent border-none cursor-pointer p-0"
                  type="button"
                >
                  Request for Blood
                </button>
              </li>
            </ul>
          </nav>

          <div className="flex items-center gap-3 mt-2 sm:mt-0">
            {isAuthenticated ? (
              <>
                <NotificationBell />
                <span className="text-white text-sm hidden sm:inline">Welcome, {currentUser?.email}</span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg bg-white text-[#db2b2b] font-semibold shadow-md hover:shadow-lg transition-transform transform hover:-translate-y-0.5"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/register" className="px-4 py-2 rounded-lg bg-white text-[#db2b2b] font-semibold shadow-md hover:shadow-lg transition-transform transform hover:-translate-y-0.5">
                  Register
                </Link>
                <Link to="/login" className="px-4 py-2 rounded-lg bg-[#db2b2b] text-white font-semibold shadow-md hover:shadow-lg transition-transform transform hover:-translate-y-0.5">
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 py-10">

        {isAuthenticated ? (

          <section className="bg-white p-7 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-6 border-b pb-2">
              <h3 className="text-2xl font-bold text-gray-800">Available Donors</h3>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>

            {urgentRequests.length > 0 && (
              <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-amber-500" aria-hidden />
                  <h4 className="text-sm font-bold uppercase tracking-wide text-amber-900">
                    Urgent &amp; critical requests
                  </h4>
                  <span className="text-xs text-amber-800/90">
                    Open needs from your community — filter donors by compatibility below.
                  </span>
                </div>
                <ul className="space-y-2">
                  {urgentRequests.map((req) => (
                    <li
                      key={req.id}
                      className="flex flex-col gap-2 rounded-lg bg-white/80 p-3 text-sm text-gray-800 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <Link to={`/request/${req.id}`} className="flex-1 min-w-0 hover:underline">
                        <span className="font-semibold text-[#db2b2b]">{req.bloodGroup || '\u2014'}</span>
                        <span className="mx-2 text-gray-400">·</span>
                        {req.hospitalLocation || 'Location not specified'}
                        {req.emergencyLevel === 'critical' && (
                          <span className="ml-2 rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                            CRITICAL
                          </span>
                        )}
                        {req.emergencyLevel === 'urgent' && (
                          <span className="ml-2 rounded bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">
                            URGENT
                          </span>
                        )}
                      </Link>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          to={`/request/${req.id}`}
                          className="rounded-lg border border-[#db2b2b] bg-white px-3 py-1.5 text-xs font-semibold text-[#db2b2b] hover:bg-red-50"
                        >
                          View & Donate
                        </Link>
                        {req.bloodGroup && (
                          <button
                            type="button"
                            onClick={() => setRecipientBloodFilter(req.bloodGroup)}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                          >
                            Filter donors
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setReportTarget({ id: req.id, type: 'request', name: `${req.bloodGroup || ''} · ${req.hospitalLocation || ''}` })}
                          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 hover:border-red-300 hover:text-red-600 transition-colors"
                          title="Report this request"
                        >
                          ⚑ Report
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mb-4 flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50/80 p-4 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="min-w-[200px] flex-1">
                <label htmlFor="recipient-filter" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Patient needs (whole-blood compatibility)
                </label>
                <select
                  id="recipient-filter"
                  value={recipientBloodFilter}
                  onChange={(e) => setRecipientBloodFilter(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#db2b2b] focus:outline-none focus:ring-2 focus:ring-[#db2b2b]/30"
                >
                  <option value="">All donor types</option>
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
              <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={onlyCompatible}
                  onChange={(e) => setOnlyCompatible(e.target.checked)}
                  className="h-4 w-4 accent-[#db2b2b]"
                />
                Only show compatible donors
              </label>
              {recipientBloodFilter ? (
                <button
                  type="button"
                  onClick={() => setRecipientBloodFilter('')}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Clear filter
                </button>
              ) : null}
              <p className="w-full text-xs text-gray-500 sm:w-auto sm:flex-1 sm:min-w-[220px]">
                {onlyCompatible
                  ? 'Only donors whose blood type can supply this patient (standard RBC rules) are listed.'
                  : 'Compatibility is shown per donor when a patient type is selected.'}
              </p>
            </div>

            <div className="mb-5 grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-12">
              <div className="md:col-span-4">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Search
                </label>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Name, email, phone, city…"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#db2b2b] focus:outline-none focus:ring-2 focus:ring-[#db2b2b]/30"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                  City
                </label>
                <input
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  placeholder={currentUserProfile?.location ? `e.g. ${currentUserProfile.location}` : 'e.g. Pune'}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#db2b2b] focus:outline-none focus:ring-2 focus:ring-[#db2b2b]/30"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Donor blood
                </label>
                <select
                  value={donorBloodFilter}
                  onChange={(e) => setDonorBloodFilter(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#db2b2b] focus:outline-none focus:ring-2 focus:ring-[#db2b2b]/30"
                >
                  <option value="">Any</option>
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

              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Min units
                </label>
                <input
                  type="number"
                  min="0"
                  value={minUnitsFilter}
                  onChange={(e) => setMinUnitsFilter(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#db2b2b] focus:outline-none focus:ring-2 focus:ring-[#db2b2b]/30"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Sort
                </label>
                <select
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#db2b2b] focus:outline-none focus:ring-2 focus:ring-[#db2b2b]/30"
                >
                  <option value="same_city">Same city first</option>
                  <option value="last_active">Last active</option>
                  <option value="units_desc">Units (high → low)</option>
                </select>
              </div>
            </div>

            <p className="text-gray-500 mb-4 text-sm">
              {recipientType && onlyCompatible
                ? `Showing ${sortedDonors.length} compatible donor${sortedDonors.length === 1 ? '' : 's'} for patient needing ${recipientType}.`
                : `Showing ${sortedDonors.length} donor${sortedDonors.length === 1 ? '' : 's'}.`}
            </p>

            {loading ? (
              <div className="text-center py-10">
                <p className="text-gray-500 text-lg">Loading donor data...</p>
              </div>
            ) : sortedDonors.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500">
                  {recipientType && onlyCompatible
                    ? `No registered donors match whole-blood compatibility for patient needing ${recipientType}. Try another type or turn off compatibility filter.`
                    : 'No donors match your filters. Try clearing search/filters.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <td className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">DONOR NAME</td>
                      <td className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">EMAIL</td>
                      <td className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">CONTACT</td>
                      <td className="px-6 py-3 text-left text-xs font-medium text-gray-600  uppercase tracking-wider">BLOOD TYPE</td>
                      <td className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">LOCATION</td>
                      <td className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">LAST ACTIVE</td>
                      <td className="px-6 py-3 text-left text-xs font-medium  text-gray-600 uppercase tracking-wider">AVAILABLE QUANTITY</td>
                      <td className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">REQUEST</td>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedDonors.map((donor, index) => (
                      <tr key={donor.id || index}>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="ml-4">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-medium text-gray-900">{donor.name}</span>
                                {donor.verified && (
                                  <span
                                    title="Verified donor"
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full"
                                  >
                                    ✓ Verified
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{donor.email}</div>

                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{donor.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 text-sm font-semibold rounded-full ${donor.bloodGroup && donor.bloodGroup.includes('+') ? 'bg-red-100 text-red-700' : 'bg-red-100 text-red-700'
                            }`}>
                            {donor.bloodGroup}
                          </span>
                          {recipientType && !onlyCompatible && (
                            <div className="mt-1 text-xs text-gray-500">
                              {donorCanHelpRecipient(donor.bloodGroup, recipientType)
                                ? `${normalizeBloodType(donor.bloodGroup) || donor.bloodGroup} → ${recipientType} (compatible)`
                                : `${normalizeBloodType(donor.bloodGroup) || donor.bloodGroup} → ${recipientType} (not compatible)`}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {donor.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {(() => {
                            const d = asDate(donor.lastActiveAt) ?? asDate(donor.createdAt)
                            return d ? d.toLocaleDateString() : '—'
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {donor.availablequantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleSendMailToDonor(donor)}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#db2b2b] hover:bg-[#c02525] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#db2b2b]"
                            >
                              Request
                            </button>
                            <button
                              type="button"
                              onClick={() => setReportTarget({ id: donor.id, type: 'donor', name: donor.name })}
                              className="inline-flex items-center px-3 py-2 border border-gray-200 text-xs font-medium rounded-md text-gray-500 hover:border-red-300 hover:text-red-600 transition-colors"
                              title="Report this donor"
                            >
                              ⚑
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : (

          <div className="space-y-16">

            <section className="flex flex-col-reverse md:flex-row items-center justify-between gap-10 py-10">
              <div className="flex-1 space-y-6">
                <h1 className="text-4xl md:text-6xl font-bold text-[#db2b2b] leading-tight">
                  Donate Blood <br />
                  <span className="text-[#db2b2b]">save a life.</span>
                </h1>
                <p className="text-lg text-gray-600 max-w-lg">
                  Every drop counts. Join our community of heroes. Connect directly with those in need and make a difference in minutes.
                </p>
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleBecomeDonorClick}
                    className="px-8 py-3 bg-white text-[#db2b2b] border-2 border-[#db2b2b] rounded-full font-bold hover:bg-red-50 transition"
                  >
                    Donate Now
                  </button>
                  <button
                    onClick={handleRequestClick}
                    className="px-8 py-3 bg-white text-[#db2b2b] border-2 border-[#db2b2b] rounded-full font-bold hover:bg-red-50 transition"
                  >
                    Find Blood
                  </button>
                </div>
              </div>
              <div className="flex-1 flex justify-center">
                <img
                  src="https://img.freepik.com/free-vector/blood-donation-concept-illustration_114360-1044.jpg"
                  alt="Blood Donation Illustration"
                  className="w-full max-w-md rounded-xl shadow-2xl"
                />
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="bg-white p-6">
                <h3 className="text-4xl font-bold text-[#db2b2b] mb-2">100+</h3>
                <p className="text-gray-600 font-medium">Donors Registered</p>
              </div>
              <div className="bg-white p-6">
                <h3 className="text-4xl font-bold text-[#db2b2b] mb-2">70+</h3>
                <p className="text-gray-600 font-medium">Lives Saved</p>
              </div>
              <div className="bg-white p-6">
                <h3 className="text-4xl font-bold text-[#db2b2b] mb-2">24*7</h3>
                <p className="text-gray-600 font-medium">Emergency Support</p>
              </div>
            </section>
          </div>
        )}
      </main>

      {showDonorPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4" onClick={() => setShowDonorPopup(false)}>
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowDonorPopup(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold">&times;</button>
            <h2 className="text-xl font-bold">Become a Donor</h2>
            <h3 className="text-xl font-bold">Thankyou For Saving a Life</h3>

            <form onSubmit={handleDonorSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#db2b2b] focus:border-transparent"
                  placeholder="Enter your full name"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#db2b2b] focus:border-transparent"
                  placeholder="Enter your email"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#db2b2b] focus:border-transparent"
                  placeholder="Enter your phone number (10 digits)"
                  value={donorPhone}
                  onChange={(e) => setDonorPhone(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#db2b2b] focus:border-transparent"
                  value={donorBloodGroup}
                  onChange={(e) => setDonorBloodGroup(e.target.value)}
                  required
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

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#db2b2b] focus:border-transparent"
                  placeholder="Enter your city"
                  value={donorLocation}
                  onChange={(e) => setDonorLocation(e.target.value)}
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Availabale Quantity</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#db2b2b] focus:border-transparent"
                  placeholder="Enter Quantity"
                  value={donorAvailableQuantity}
                  onChange={(e) => setAvailableQuantity(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDonorPopup(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#db2b2b] text-white rounded-lg font-semibold hover:bg-[#c02525] transition-colors"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRequestPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4" onClick={() => setShowRequestPopup(false)}>
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex flex-col">
                  <h2 className="text-xl font-bold">Request for Blood</h2>
                  <h3 className="text-xl font-bold">Always Available For You</h3>
                </div>
                <button onClick={() => setShowRequestPopup(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none">&times;</button>
              </div>

              <form className="space-y-4" onSubmit={handleRequestSubmit}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name <span className="text-red-500"></span></label>
                  <input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded" placeholder="Enter patient's name" value={patientName} onChange={(event) => setPatientName(event.target.value)} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group <span className="text-red-500"></span></label>
                  <select required className="w-full px-3 py-2 border border-gray-300 rounded" onChange={(e) => setBloodGroup(e.target.value)} value={bloodGroup}>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1"> Contact Email <span className="text-red-500"></span></label>
                  <input
                    type="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="Enter email"
                    value={requestEmail}
                    onChange={(e) => setRequestEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1"> Phone No. <span className="text-red-500"></span></label>
                  <input type="tel" required className="w-full px-3 py-2 border border-gray-300 rounded" placeholder="Enter phone number (10 digits)" value={requestPhone} onChange={(e) => setRequestPhone(e.target.value)} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">How much blood required <span className="text-red-500"></span></label>
                  <input required type="number" className="w-full px-3 py-2 border border-gray-300 rounded" placeholder="Enter number of units" value={unitsRequired} onChange={(e) => setUnitsRequired(e.target.value)} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">How much Emergency <span className="text-red-500"></span></label>
                  <select required className="w-full px-3 py-2 border border-gray-300 rounded" value={emergencyLevel} onChange={(e) => setEmergencyLevel(e.target.value)}>
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hospital & Location <span className="text-red-500"></span></label>
                  <input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded" placeholder="Enter hospital name and city" value={hospitalLocation} onChange={(e) => setHospitalLocation(e.target.value)} />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowRequestPopup(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-[#db2b2b] text-white rounded-lg font-semibold hover:bg-[#c02525] transition-colors">Submit Request</button>
                </div>
                <p className="text-xs text-gray-400 pt-1 text-center">\u23f1 You may submit up to 3 blood requests per 24\u00a0hours.</p>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Report modal */}
      {reportTarget && (
        <ReportModal
          target={reportTarget}
          onClose={() => setReportTarget(null)}
        />
      )}
    </div>
  )
}

export default Home