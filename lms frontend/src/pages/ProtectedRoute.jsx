// src/components/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom'

const ProtectedRoute = ({ allowedRole = null }) => {
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role') // assuming you save role too

  const isLoggedIn = !!token

  // If not logged in → redirect to login
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  // If we have a role restriction (like teacher only)
  if (allowedRole && role !== allowedRole) {
    return <Navigate to="/" replace /> // or to a "not authorized" page
  }

  // All good → show the page
  return <Outlet />
}

export default ProtectedRoute