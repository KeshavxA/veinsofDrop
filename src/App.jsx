import React from 'react'
import { BrowserRouter as Router, Navigate, Route, Routes} from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import firebase from './firebase.js'

import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'

function App() {
  console.log('Firebase app initialized:', firebase);

  return (
   
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App

