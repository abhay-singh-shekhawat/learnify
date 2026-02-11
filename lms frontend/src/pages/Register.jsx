// src/pages/Register.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../utils/api'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const cloud_name = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME

const Register = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')
  const [avatarFile, setAvatarFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleAvatarUpload = async () => {
    if (!avatarFile) return { url: '', publicId: '' }

    try {
      const sigRes = await api.get('/api-v1/user/get-cloudinary-signature-avatar')
      const { timestamp, signature, api_key } = sigRes.data

      const formData = new FormData()
      formData.append('file', avatarFile)
      formData.append('api_key', api_key)
      formData.append('timestamp', timestamp)
      formData.append('signature', signature)
      formData.append('folder', 'user/avatar')

      const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`, {
        method: 'POST',
        body: formData,
      })

      const cloudData = await cloudRes.json()

      if (!cloudRes.ok || !cloudData.secure_url) {
        throw new Error(cloudData.error?.message || 'Avatar upload failed')
      }

      return {
        url: cloudData.secure_url,
        publicId: cloudData.public_id
      }
    } catch (err) {
      toast.error('Avatar upload failed')
      console.error(err)
      return { url: '', publicId: '' }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!name.trim() || !email.trim() || !password.trim()) {
      return toast.error('Name, email and password are required')
    }

    setLoading(true)

    try {
      let avatarUrl = ''
      let publicId = ''

      if (avatarFile) {
        const uploadResult = await handleAvatarUpload()
        avatarUrl = uploadResult.url
        publicId = uploadResult.publicId
      }

      const payload = {
        Name: name.trim(),
        Email: email.trim().toLowerCase(),
        Password: password,
        Role: role
      }

      if (avatarUrl && publicId) {
        payload.Avatar = avatarUrl
        payload.publicId = publicId
      }

      const res = await api.post('/api-v1/user/register', payload)

      if (res.data.success) {
        toast.success('OTP sent to your email. Please check your inbox.')
        // Redirect to OTP verification page and pass email
        navigate('/verify-otp', { 
          state: { 
            email: email.trim().toLowerCase() 
          }
        })
      } else {
        throw new Error(res.data.message || 'Registration request failed')
      }
    } catch (err) {
      console.error('Registration error:', err)
      const errorMessage = 
        err.response?.data?.message ||
        err.message ||
        'Something went wrong. Please try again.'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
          <CardDescription className="text-center">
            Enter your details to get started
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label>I want to be a *</Label>
              <Select 
                value={role} 
                onValueChange={setRole} 
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar">Profile Picture (optional)</Label>
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                disabled={loading}
              />
              {avatarFile && (
                <p className="text-sm text-muted-foreground mt-1 truncate">
                  Selected: {avatarFile.name}
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Creating account & sending OTP...' : 'Continue →'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3 text-sm text-center text-muted-foreground pt-2">
          <p>
            Already have an account?{' '}
            <Link 
              to="/login" 
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
          <p className="text-xs">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

export default Register