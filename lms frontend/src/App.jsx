// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import ProtectedRoute from './components/ProtectedRoute'  // ← NEW IMPORT

import Home from './pages/Home'
import CourseDetail from './pages/CourseDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import VerifyOtp from './pages/VerifyOtp'
import ForgotPassword from './pages/ForgotPassword'
import Profile from './pages/Profile'
import TeacherDashboard from './pages/TeacherDashboard'
import StudentDashboard from './pages/StudentDashboard'
import WatchLecture from './pages/WatchLecture'

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="container mx-auto py-6 px-4 md:px-6">
        <Routes>
          {/* Public routes – no login required */}
          <Route path="/" element={<Home />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />

          {/* Forgot password placeholder */}
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected routes – use ProtectedRoute wrapper */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/student-dashboard" element={<StudentDashboard />} />
          </Route>

          {/* Teacher-only route */}
          <Route element={<ProtectedRoute allowedRole="teacher" />}>
            <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
          </Route>

          {/* Lecture watching – assuming it's protected now */}
          <Route element={<ProtectedRoute />}>
            <Route path="/watch/:courseId" element={<WatchLecture />} />
            <Route path="/watch/:courseId/:lectureId" element={<WatchLecture />} />
          </Route>

          {/* Catch-all redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App