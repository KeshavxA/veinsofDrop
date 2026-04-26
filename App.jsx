import React from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from './src/contexts/ThemeContext'
import { AuthProvider } from './src/contexts/AuthContext'
import { NotificationProvider } from './src/contexts/NotificationContext'
import ProtectedRoute from './src/components/ProtectedRoute'
import AdminRoute from './src/components/AdminRoute'
import AlertBanner from './src/components/AlertBanner'
import PWAInstallBanner from './src/components/PWAInstallBanner'

import Home from './src/pages/Home'
import Login from './src/pages/Login'
import Register from './src/pages/Register'
import Profile from './src/pages/Profile'
import RequestDetail from './src/pages/RequestDetail'
import AdminDashboard from './src/pages/AdminDashboard'

function App() {

  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <NotificationProvider>
            <AlertBanner />
            <PWAInstallBanner />
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
              <Route path="/request/:id" element={<RequestDetail />} />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  )
}

export default App