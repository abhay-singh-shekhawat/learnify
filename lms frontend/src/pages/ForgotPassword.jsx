// src/pages/ForgotPassword.jsx  (updated – reuse resend-otp)
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email.trim()) {
      return toast.error('Please enter your email')
    }

    setLoading(true)

    try {
      // Reuse the existing resend-otp endpoint
      const res = await api.post('/api-v1/user/resend-otp', {
        Email: email.trim().toLowerCase(),
      })

      if (res.status === 200) {
        toast.success('OTP sent to your email!')
        navigate('/verify-otp', {
          state: {
            email: email.trim().toLowerCase(),
            mode: 'reset',           // optional – if you want to distinguish later
          },
        })
      } else {
        throw new Error('Failed to send reset OTP')
      }
    } catch (err) {
      console.error(err)
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Could not send OTP. Please check if the email is registered.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
          <CardDescription className="text-center">
            Enter your email to receive a reset code
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset OTP'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="text-center text-sm text-muted-foreground">
          <Button variant="link" onClick={() => navigate('/login')}>
            Back to login
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default ForgotPassword