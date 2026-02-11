// src/pages/VerifyOtp.jsx
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { saveToken } from '../utils/auth';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const VerifyOtp = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [countdown, setCountdown] = useState(60);

  const { state } = useLocation();
  const navigate = useNavigate();

  const email = state?.email;

  useEffect(() => {
    if (!email) {
      toast.error('No email provided. Please register again.');
      navigate('/register');
    }
  }, [email, navigate]);

  // Countdown for resend button
  useEffect(() => {
    if (!canResend) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanResend(true);
            return 60;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [canResend]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.length < 4) {
      return toast.error('Please enter a valid OTP');
    }

    setLoading(true);

    try {
      const res = await api.post('/api-v1/user/verify-otp', {
        Otp: otp.trim(),
        Email: email,
      });

      if (res.data.token) {
        saveToken(res.data.token);
        toast.success('Email verified! Welcome 🎉');
        navigate('/');
      } else {
        throw new Error(res.data.message || 'Verification failed');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid/expired OTP';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setResendLoading(true);
    setCanResend(false);
    setCountdown(60);

    try {
      await api.post('/api-v1/user/resend-otp', { Email: email });
      toast.success('New OTP sent!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend OTP';
      toast.error(msg);
      setCanResend(true); // allow retry immediately on error
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Verify Email</CardTitle>
          <CardDescription className="text-center">
            Enter the 6-digit OTP sent to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="otp">OTP</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
                inputMode="numeric"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Didn't receive the code?{' '}
              <Button
                variant="link"
                className="p-0 h-auto font-medium"
                onClick={handleResend}
                disabled={!canResend || resendLoading}
              >
                {resendLoading
                  ? 'Sending...'
                  : canResend
                  ? 'Resend OTP'
                  : `Resend in ${countdown}s`}
              </Button>
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          <Button variant="ghost" onClick={() => navigate('/register')}>
            Back to registration
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default VerifyOtp;