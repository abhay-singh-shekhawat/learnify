// src/components/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom'
import { getToken, getUserRole } from '../utils/auth'

const ProtectedRoute = ({ allowedRole = null }) => {
  const token = getToken()
  const role = getUserRole()

  const isLoggedIn = !!token

  // Not logged in → redirect to login
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  // Role restricted route but wrong role → redirect to home
  if (allowedRole && role !== allowedRole) {
    return <Navigate to="/" replace />
  }

  // All good → render the nested route (TeacherDashboard)
  return <Outlet />
}

export default ProtectedRoute