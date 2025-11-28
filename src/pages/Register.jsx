import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

function Register() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
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

    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (!formData.agreeToTerms) {
      setError('Please agree to the terms and conditions.')
      return
    }

    setLoading(true)

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      )
      
     
      console.log('User registered successfully:', userCredential.user.email)
      
      navigate('/')
    } catch (error) {
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('An account with this email already exists. Please try logging in instead.')
          break
        case 'auth/invalid-email':
          setError('Invalid email address format. Please check your email and try again.')
          break
        case 'auth/operation-not-allowed':
          setError(
            'Email/Password authentication is not enabled in Firebase Console. ' +
            'Please enable it: 1) Go to Firebase Console → 2) Select your project → 3) Click Authentication → ' +
            '4) Go to Sign-in method tab → 5) Click Email/Password → 6) Enable it → 7) Click Save'
          )
        
          console.warn('Email/Password authentication not enabled in Firebase Console')
          break
        case 'auth/weak-password':
          setError('Password is too weak. Please choose a stronger password (at least 6 characters).')
          break
        case 'auth/network-request-failed':
          setError('Network error. Please check your internet connection and try again.')
          break
        default:
          
          if (error.message && (error.message.includes('network') || error.message.includes('ERR_CONNECTION'))) {
            setError(
              'Connection error. Please check: 1) Email/Password is enabled in Firebase Console ' +
              '(Authentication → Sign-in method → Email/Password), 2) Your internet connection, 3) Try again in a few moments.'
            )
            console.warn('Network error during registration:', error.message)
          } else if (error.code === 'auth/operation-not-allowed') {
           
            setError('Email/Password authentication is not enabled. Please enable it in Firebase Console.')
            console.warn('Email/Password authentication not enabled')
          } else {
            
            console.error('Unexpected registration error:', error)
            setError(`Failed to create account. ${error.message || 'Please try again or contact support.'}`)
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
            to="/login" 
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/80 text-[#db2b2b] font-medium shadow-lg shadow-[#db2b2b]/10 hover:-translate-y-0.5 transition-transform"
          >
            Sign in
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
              Join the mission
            </div>
            <h1 className="text-4xl sm:text-5xl font-semibold leading-tight text-[#142323]">
              Become a donor and save lives in your community.
            </h1>
            <p className="text-lg text-[#142323]/75 max-w-2xl">
              Register now to connect with hospitals and families in need. Your blood donation can make the difference between life and death. Join thousands of heroes making an impact every day.
            </p>

           
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="bg-white/70 border border-white/60 rounded-3xl p-6 shadow-[0_30px_60px_-35px_rgba(20,35,35,0.6)] float-animation backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-full bg-[#db2b2b]/10 grid place-items-center text-[#db2b2b] font-semibold">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold">Save Lives</p>
                    <p className="text-xs text-[#142323]/60">Make a real impact</p>
                  </div>
                </div>
                <p className="text-sm text-[#142323]/70">Every donation can save up to 3 lives. Join our community of lifesavers.</p>
              </div>
              <div className="bg-white/70 border border-white/60 rounded-3xl p-6 shadow-[0_30px_60px_-35px_rgba(20,35,35,0.6)] float-animation-delayed backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-full bg-[#db2b2b]/10 grid place-items-center text-[#db2b2b] font-semibold">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold">Secure & Safe</p>
                    <p className="text-xs text-[#142323]/60">Your data protected</p>
                  </div>
                </div>
                <p className="text-sm text-[#142323]/70">Your information is encrypted and secure. We prioritize your privacy.</p>
              </div>
            </div>
          </div>

       
          <form 
            onSubmit={handleSubmit}
            className="relative bg-white/80 border border-white/70 rounded-3xl shadow-[0_38px_80px_-35px_rgba(219,43,43,0.55)] p-8 space-y-6 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-[#142323]">Create account</h2>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#db2b2b]/10 text-[#db2b2b] text-xs font-medium">
                Join Us
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
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
                placeholder="Enter your email address" 
                required 
                className="rounded-xl border border-[#db2b2b]/15 bg-white px-4 py-3 text-base text-[#142323] placeholder:text-[#142323]/40 focus:border-[#db2b2b] focus:outline-none focus:ring-2 focus:ring-[#db2b2b]/30 transition"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-[#142323]">
              Password
              <input 
                type="password" 
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password (min. 6 characters)" 
                required 
                minLength={6}
                className="rounded-xl border border-[#db2b2b]/15 bg-white px-4 py-3 text-base text-[#142323] placeholder:text-[#142323]/40 focus:border-[#db2b2b] focus:outline-none focus:ring-2 focus:ring-[#db2b2b]/30 transition"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-[#142323]">
              Confirm Password
              <input 
                type="password" 
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password" 
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

            <label className="inline-flex items-start gap-2 text-sm text-[#142323]/70">
              <input 
                type="checkbox" 
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                required
                className="mt-1 rounded border-[#db2b2b]/20 text-[#db2b2b] focus:ring-[#db2b2b]/40"
              />
              <span>I agree to the <a href="#" className="text-[#db2b2b] font-medium hover:underline">Terms and Conditions</a> and <a href="#" className="text-[#db2b2b] font-medium hover:underline">Privacy Policy</a></span>
            </label>

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
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                  </svg>
                </>
              )}
            </button>

            <p className="text-sm text-center text-[#142323]/70">
              Already have an account? <Link to="/login" className="text-[#db2b2b] font-medium hover:underline">Sign in</Link>
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

export default Register
