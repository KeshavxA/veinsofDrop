import React from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './src/contexts/AuthContext'
import { NotificationProvider } from './src/contexts/NotificationContext'
import ProtectedRoute from './src/components/ProtectedRoute'
import AlertBanner from './src/components/AlertBanner'

import Home from './src/pages/Home'
import Login from './src/pages/Login'
import Register from './src/pages/Register'
import Profile from './src/pages/Profile'

function App() {

  return (

    <Router>
      <AuthProvider>
        <NotificationProvider>
          <AlertBanner />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  )
}

export default App