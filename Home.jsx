import React from 'react'
import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="m-0 p-0 font-sans bg-[#e6fffb] text-[#9ab3b3] leading-relaxed min-h-screen">
      <aside className="fixed top-1/2 left-4 -translate-y-1/2 flex flex-col gap-3 z-50">
       
      </aside>
      <header className="bg-gradient-to-r from-[rgb(191,203,203)] to-[rgb(219,43,43)] text-white">
        <div className="max-w-[1400px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between py-3 gap-2 sm:gap-0 relative">
          <div className="flex items-center gap-3">
            <img src="/assets/logo.png" alt="veinsofDrop logo" className="h-11 w-auto block rounded-md" />
            <h1 className="m-0 text-xl"></h1>
          </div>
          <nav aria-label="Main navigation" className="absolute left-1/2 transform -translate-x-1/2">
            <ul className="flex gap-4">
              <li><Link to="/" className="text-white hover:text-red-700 font-semibold">Home</Link></li>
              <li><a href="#" className="text-white hover:text-red-700 font-semibold">Account</a></li>
            </ul>
          </nav>
          <div className="flex items-center gap-3 mt-2 sm:mt-0">
            <Link to="/register" className="px-4 py-2 rounded-lg bg-white text-[#db2b2b] font-semibold shadow-md hover:shadow-lg transition-transform transform hover:-translate-y-0.5">
              Register
            </Link>
            <Link to="/login" className="px-4 py-2 rounded-lg bg-[#db2b2b] text-white font-semibold shadow-md hover:shadow-lg transition-transform transform hover:-translate-y-0.5">
              Login
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 py-10">
        <section className="bg-white/60 p-7 rounded-lg shadow-sm">
          <h2 className="mt-0">Welcome to veinsofDrop</h2>
        </section>
      </main>

      <footer className="bg-[#f1f7f7] py-4 mt-8 border-t border-black/5">
        <div className="max-w-[1400px] mx-auto px-4 text-[#053c3c] text-center">
          <p>&copy; <span>{new Date().getFullYear()}</span> Footer</p>
        </div>
      </footer>
    </div>
  )
}

export default Home

