// src/pages/Login.jsx
import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import api from '../utils/api'
import { saveToken, saveUserRole } from '../utils/auth'  // ← make sure both are imported
import { toast } from 'react-toastify'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()  // ← NEW: to redirect back to where user came from

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email.trim() || !password.trim()) {
      return toast.error('Email and password are required')
    }

    setLoading(true)

    try {
      const res = await api.post('/api-v1/user/login', {
        Email: email.trim(),
        Password: password,
      })

      if (res.data.success && res.data.token) {
        // Save token
        saveToken(res.data.token)

        // Save role - adjust field name based on your actual API response
        // Common possibilities:
        // res.data.user.Role
        // res.data.role
        // res.data.user.role
        // Choose ONE line below that matches your backend response
        const userRole = res.data.user?.Role || res.data.role || res.data.user?.role || null

        if (userRole) {
          saveUserRole(userRole)
        } else {
          console.warn('No role found in login response')
        }

        toast.success('Login successful!')

        // Smart redirect: go back to where user came from, or default to home/student dashboard
        const from = location.state?.from?.pathname || 
                     (userRole === 'teacher' ? '/teacher-dashboard' : '/student-dashboard')
        
        navigate(from, { replace: true })
      } else {
        throw new Error(res.data.message || 'Login failed')
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to sign in
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {/* Forgot password link */}
            <div className="flex justify-end text-sm">
              <Link
                to="/forgot-password"
                className="text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2 text-sm text-center text-muted-foreground">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Register
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

export default Login