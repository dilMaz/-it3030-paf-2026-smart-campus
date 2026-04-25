import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import Dashboard from './pages/Dashboard'
import TechnicianDashboard from './pages/TechnicianDashboard'
import AuthCallbackPage from './pages/AuthCallbackPage'
import NotificationsPage from './pages/NotificationsPage'
import AdminUsersPage from './pages/AdminUsersPage'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import ResourceListPage from './pages/ResourceListPage'
import BookingsPage from './pages/BookingsPage'
import ProfilePage from './pages/ProfilePage'
import AdminDashboard from './pages/AdminDashboard'
import TicketsPage from './pages/TicketsPage'
import { useAuth } from './hooks/useAuth'

function DashboardRouter() {
  const { roles } = useAuth()
  const isTechnician = roles.includes('TECHNICIAN')

  return isTechnician ? <TechnicianDashboard /> : <Dashboard />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<DashboardRouter />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'USER']} />}>
              <Route path="/bookings" element={<BookingsPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'TECHNICIAN', 'USER']} />}>
              <Route path="/tickets" element={<TicketsPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'USER']} />}>
              <Route path="/facilities" element={<ResourceListPage />} />
              <Route path="/resources" element={<ResourceListPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/tickets" element={<TicketsPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
