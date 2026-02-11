// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Home from './pages/Home'
import CourseDetail from './pages/CourseDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import VerifyOtp from './pages/VerifyOtp'          // ← NEW
import ForgotPassword from './pages/ForgotPassword' // ← placeholder (optional but recommended)
import Profile from './pages/Profile'
import TeacherDashboard from './pages/TeacherDashboard'
import StudentDashboard from './pages/StudentDashboard'
import WatchLecture from './pages/WatchLecture'
import { getUserRole } from './utils/auth'

function App() {
  const role = getUserRole()
  const isLoggedIn = !!localStorage.getItem('token')

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="container mx-auto py-6 px-4 md:px-6">
        <Routes>
          {/* ── Public / No auth required ── */}
          <Route path="/" element={<Home />} />
          <Route path="/courses/:id" element={<CourseDetail />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ── OTP & future password reset flow ── */}
          <Route path="/verify-otp" element={<VerifyOtp />} />

          {/* Temporary placeholder – prevents 404 when clicking "Forgot password?" */}
          <Route
            path="/forgot-password"
            element={<ForgotPassword />} // ← you can replace later with real implementation
          />

          {/* ── Protected routes – must be logged in ── */}
          <Route
            path="/profile"
            element={isLoggedIn ? <Profile /> : <Navigate to="/login" replace />}
          />

          <Route
            path="/student-dashboard"
            element={
              isLoggedIn ? <StudentDashboard /> : <Navigate to="/login" replace />
            }
          />

          {/* Teacher-only protected route */}
          <Route
            path="/teacher-dashboard"
            element={
              isLoggedIn && role === 'teacher' ? (
                <TeacherDashboard />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* ── Lecture watching (can be public or protected – decide based on your logic) ── */}
          <Route path="/watch/:courseId" element={<WatchLecture />} />
          <Route path="/watch/:courseId/:lectureId" element={<WatchLecture />} />

          {/* ── Fallback ── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App