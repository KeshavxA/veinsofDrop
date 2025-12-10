import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../contexts/AuthContext'


function Login() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (currentUser) {
      navigate('/')
    }
  }, [currentUser, navigate])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const userCredential = await  signInWithEmailAndPassword(
        auth, 
        formData.email,
        formData.password
      )
      
      console.log('User logged in successfully:', userCredential.user.email)
      navigate('/')
    } catch (error) {
      switch (error.code) {
        case 'auth/user-not-found':
          setError('No account found with this email address. Please check your email or register for a new account.')
          break
        case 'auth/wrong-password':
          setError('Incorrect password. Please try again or use "Forgot password?" to reset it.')
          break
        case 'auth/invalid-email':
          setError('Invalid email address format. Please check your email and try again.')
          break
        case 'auth/user-disabled':
          setError('This account has been disabled. Please contact support for assistance.')
          break
        case 'auth/too-many-requests':
          setError('Too many failed login attempts. Please wait a few minutes and try again.')
          break
        case 'auth/network-request-failed':
          setError('Network error. Please check your internet connection and try again.')
          break
        case 'auth/operation-not-allowed':
          setError(
            'Email/Password authentication is not enabled in Firebase Console. ' +
            'Please enable it: 1) Go to Firebase Console → 2) Select your project → 3) Click Authentication → ' +
            '4) Go to Sign-in method tab → 5) Click Email/Password → 6) Enable it → 7) Click Save'
          )
          console.warn('Email/Password authentication not enabled in Firebase Console')
          break
        default:
          if (error.message && (error.message.includes('network') || error.message.includes('ERR_CONNECTION'))) {
            setError(
              'Connection error. Please check: 1) Email/Password is enabled in Firebase Console ' +
              '(Authentication → Sign-in method → Email/Password), 2) Your internet connection, 3) Try again in a few moments.'
            )
            console.warn('Network error during login:', error.message)
          } else if (!error.code) {
            setError('Connection error. Please check: 1) Email/Password is enabled in Firebase Console, 2) Your internet connection.')
            console.warn('Login error without code:', error.message)
          } else {
      
            console.error('Unexpected login error:', error)
            setError(`Failed to sign in. ${error.message || 'Please try again or contact support.'}`)
          }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative bg-[#f8fafa] text-[#244141]">
      <div className="fixed inset-0 overflow-hidden z-0" aria-hidden="true">
        <div 
          className="absolute w-[60vmax] h-[60vmax] rounded-full blur-[80px] opacity-60 plasma-gradient-bg-2"
          style={{
            background: 'radial-gradient(circle at center, rgba(255, 229, 229, 0.7), rgba(219, 43, 43, 0.35), rgba(36, 65, 65, 0.65))',
            top: '-18vmax',
            right: '-12vmax'
          }}
        />
        <div 
          className="absolute w-[60vmax] h-[60vmax] rounded-full blur-[80px] opacity-60 plasma-gradient-bg-1"
          style={{
            background: 'radial-gradient(circle at center, rgba(219, 43, 43, 0.55), rgba(71, 2, 23, 0.85))',
            bottom: '-20vmax',
            left: '-20vmax'
          }}
        />
      </div>

      <div 
        className="fixed inset-0 opacity-70 pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(219, 43, 43, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(219, 43, 43, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          maskImage: 'radial-gradient(circle at center, rgba(0,0,0,0.7), rgba(0,0,0,0))'
        }}
        aria-hidden="true"
      />

      <header className="relative z-10">
        <nav className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 text-[#142323] font-semibold tracking-wide hover:opacity-80 transition-opacity">
            <img src="/assets/logo.png" alt="veinsofDrop" className="w-11 h-11 rounded-xl shadow-lg shadow-[#db2b2b]/20" />
            <span>veinsofDrop</span>
          </Link>
          <Link 
            to="/register" 
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#db2b2b] text-white font-medium shadow-lg shadow-[#db2b2b]/20 hover:-translate-y-0.5 transition-transform"
          >
            Become a donor
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
            </svg>
          </Link>
        </nav>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 pb-16">
        <section className="grid gap-12 lg:grid-cols-[1.05fr_1fr] items-center min-h-[calc(100vh-200px)]">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/80 text-[#db2b2b] text-sm font-medium shadow shadow-[#db2b2b]/10">
              <span className="w-2 h-2 rounded-full bg-[#db2b2b] animate-ping"></span>
              Welcome back, hero
            </div>
            <h1 className="text-4xl sm:text-5xl font-semibold leading-tight text-[#142323]">
              Log in to track donations and respond to urgent calls faster.
            </h1>
            <p className="text-lg text-[#142323]/75 max-w-2xl">
              Your dashboard connects you to nearby hospitals, requests from families in need, and your personal impact timeline. Stay ready to respond when every second matters.
            </p>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="bg-white/70 border border-white/60 rounded-3xl p-6 shadow-[0_30px_60px_-35px_rgba(20,35,35,0.6)] float-animation backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-full bg-[#db2b2b]/10 grid place-items-center text-[#db2b2b] font-semibold">A+</div>
                  <div>
                    <p className="font-semibold">Riya, Mumbai</p>
                    <p className="text-xs text-[#142323]/60">Donor since 2022</p>
                  </div>
                </div>
                <p className="text-sm text-[#142323]/70">"veinsofDrop alerted me to an emergency barely 10 minutes away. Logged in, confirmed, and helped a young thalassemia patient. It felt seamless."</p>
              </div>
              <div className="bg-white/70 border border-white/60 rounded-3xl p-6 shadow-[0_30px_60px_-35px_rgba(20,35,35,0.6)] float-animation-delayed backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-full bg-[#db2b2b]/10 grid place-items-center text-[#db2b2b] font-semibold">O-</div>
                  <div>
                    <p className="font-semibold">Ethan, Delhi</p>
                    <p className="text-xs text-[#142323]/60">First-time donor</p>
                  </div>
                  </div>
                   <p className="text-sm text-[#142323]/70">"The app guided me through everything—from matching to post-donation care tips. Logging in keeps me connected to the community."</p>
              </div>
            </div>
          </div>

          <form 
            onSubmit={handleSubmit}
            className="relative bg-white/80 border border-white/70 rounded-3xl shadow-[0_38px_80px_-35px_rgba(219,43,43,0.55)] p-8 space-y-6 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-[#142323]">Welcome back</h2>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#db2b2b]/10 text-[#db2b2b] text-xs font-medium">
                Secure Access
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M16.5 2.25a.75.75 0 0 1 .75.75v1.5h.75a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 18 22.5H6a2.25 2.25 0 0 1-2.25-2.25V6.75A2.25 2.25 0 0 1 6 4.5h.75V3a.75.75 0 0 1 .75-.75h9Zm-7.5 2.25h6v.75a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-.75ZM12 10.5a2.25 2.25 0 0 1 2.25 2.25A2.25 2.25 0 0 1 12 15h-.75v1.5h1.5a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1-.75-.75V15a.75.75 0 0 1 .75-.75H12a.75.75 0 0 0 0-1.5h-1.5a.75.75 0 0 1 0-1.5H12Z" clipRule="evenodd" />
                </svg>
              </span>
            </div>

            <label className="flex flex-col gap-2 text-sm font-medium text-[#142323]">
              Email
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your registered email" 
                required 
                className="rounded-xl border border-[#db2b2b]/15 bg-white px-4 py-3 text-base text-[#142323] placeholder:text-[#142323]/40 focus:border-[#db2b2b] focus:outline-none focus:ring-2 focus:ring-[#db2b2b]/30 transition"
              />
            </label>

            {error && (
              <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 leading-relaxed">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="flex-1">{error}</span>
                </div>
              </div>
            )}

            <label className="flex flex-col gap-2 text-sm font-medium text-[#142323]">
              Password
              <input 
                type="password" 
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password" 
                required 
                className="rounded-xl border border-[#db2b2b]/15 bg-white px-4 py-3 text-base text-[#142323] placeholder:text-[#142323]/40 focus:border-[#db2b2b] focus:outline-none focus:ring-2 focus:ring-[#db2b2b]/30 transition"
              />
            </label>

            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2 text-[#142323]/70">
                <input 
                  type="checkbox" 
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                  className="rounded border-[#db2b2b]/20 text-[#db2b2b] focus:ring-[#db2b2b]/40"
                />
                Keep me logged in
              </label>
              <a href="#" className="text-[#db2b2b] font-medium hover:underline">Forgot password?</a>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full inline-flex justify-center items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#db2b2b] text-white font-semibold text-base shadow-lg shadow-[#db2b2b]/30 hover:-translate-y-0.5 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  Access Dashboard
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12m-19.5 0l8.954 8.955c.44.439 1.152.439 1.591 0L21.75 12m-19.5 0h19.5" />
                  </svg>
                </>
              )}
            </button>

            <div className="space-y-4 text-sm text-[#142323]/70">
              <div className="flex items-center gap-3">
                <span className="flex-1 h-px bg-gradient-to-r from-transparent via-[#db2b2b]/20 to-transparent"></span>
                Or continue with
                <span className="flex-1 h-px bg-gradient-to-r from-transparent via-[#db2b2b]/20 to-transparent"></span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <button 
                  type="button" 
                  className="flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-[#db2b2b]/15 bg-white text-[#142323]/80 hover:border-[#db2b2b]/40 transition"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
                <button 
                  type="button" 
                  className="flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-[#db2b2b]/15 bg-white text-[#142323]/80 hover:border-[#db2b2b]/40 transition"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </button>
              </div>
            </div>

            <p className="text-sm text-center text-[#142323]/70">
              New to veinsofDrop? <Link to="/register" className="text-[#db2b2b] font-medium hover:underline">Create an account</Link>
            </p>
          </form>
        </section>
      </main>

      <footer className="relative z-10 px-6 pb-10">
        <div className="max-w-6xl mx-auto text-sm text-[#142323]/60 flex flex-wrap items-center justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} veinsofDrop. Empowering every heartbeat.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:underline">Terms</a>
            <a href="#" className="hover:underline">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Login

