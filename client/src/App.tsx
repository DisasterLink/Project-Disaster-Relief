import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Toaster } from 'react-hot-toast'

// Lazy load pages for code splitting
const HomePage = React.lazy(() => import('./pages/HomePage'))
const LoginPage = React.lazy(() => import('./pages/LoginPage'))
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'))
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'))
const VolunteerDashboard = React.lazy(() => import('./pages/VolunteerDashboard'))
const CivilianDashboard = React.lazy(() => import('./pages/CivilianDashboard'))
const SOSPage = React.lazy(() => import('./pages/SOSPage'))
const ResourcesPage = React.lazy(() => import('./pages/ResourcesPage'))
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'))

// Full-screen loading spinner
const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 14, background: 'var(--color-bg)' }}>
    <div style={{ width: 44, height: 44, border: '3px solid rgba(239,68,68,0.2)', borderTop: '3px solid #ef4444', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <span style={{ color: '#9ca3af', fontSize: 13, letterSpacing: 0.5 }}>Loading...</span>
  </div>
)

// Protected route wrapper with RBAC
const ProtectedRoute = ({ children, roles }: { children: React.ReactNode; roles?: string[] }) => {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return <>{children}</>
}

const AppRoutes = () => {
  const { user } = useAuth()

  // Role-based default redirect after login
  const afterLogin = user?.role === 'admin'
    ? '/admin'
    : user?.role === 'volunteer'
    ? '/volunteer'
    : user?.role === 'civilian'
    ? '/my-requests'
    : '/'

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={user ? <Navigate to={afterLogin} replace /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to={afterLogin} replace /> : <RegisterPage />} />

        {/* Civilian */}
        <Route path="/my-requests" element={<ProtectedRoute roles={['civilian']}><CivilianDashboard /></ProtectedRoute>} />
        <Route path="/sos" element={<ProtectedRoute roles={['civilian']}><SOSPage /></ProtectedRoute>} />

        {/* Volunteer */}
        <Route path="/volunteer" element={<ProtectedRoute roles={['volunteer']}><VolunteerDashboard /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/resources" element={<ProtectedRoute roles={['admin']}><ResourcesPage /></ProtectedRoute>} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}

const App = () => (
  <ErrorBoundary>
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1f2937', color: '#f9fafb', border: '1px solid rgba(255,255,255,0.1)', fontSize: 14 },
          success: { iconTheme: { primary: '#22c55e', secondary: '#1f2937' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#1f2937' } },
        }}
      />
      <AppRoutes />
    </AuthProvider>
  </ErrorBoundary>
)

export default App
