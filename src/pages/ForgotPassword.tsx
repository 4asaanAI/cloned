import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Key } from 'lucide-react';
import { supabase } from '../lib/supabase';

type RecoveryMethod = 'email' | 'phone';

export function ForgotPassword() {
  const [step, setStep] = useState<'method' | 'input' | 'otp' | 'reset'>('method');
  const [method, setMethod] = useState<RecoveryMethod>('email');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleMethodSelect = (selectedMethod: RecoveryMethod) => {
    setMethod(selectedMethod);
    setStep('input');
    setError('');
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (method === 'email') {
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, role, email')
          .eq('email', identifier)
          .maybeSingle();

        if (profileError) throw profileError;

        if (!profiles) {
          setError('No account found with this email address');
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(identifier, {
          redirectTo: `${window.location.origin}/reset-password`
        });

        if (error) throw error;

        setSuccess('Password reset link has been sent to your email');
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
      } else {
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, role, phone, parent_phone')
          .or(`phone.eq.${identifier},parent_phone.eq.${identifier}`)
          .maybeSingle();

        if (profileError) throw profileError;

        if (!profiles) {
          setError('No account found with this phone number');
          setLoading(false);
          return;
        }

        if (profiles.role === 'student' && profiles.parent_phone !== identifier) {
          setError('For student accounts, password can only be reset using parent phone number');
          setLoading(false);
          return;
        }

        setSuccess('OTP functionality would be implemented here. Please use email recovery for now.');
        setStep('otp');
      }
    } catch (err: any) {
      console.error('Error sending recovery:', err);
      setError(err.message || 'Failed to send recovery information');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      if (otp === '123456') {
        setStep('reset');
        setSuccess('OTP verified successfully');
      } else {
        setError('Invalid OTP. Please try again.');
      }
      setLoading(false);
    }, 1000);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      setSuccess('Password reset functionality would be implemented here');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Link
          to="/login"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Login
        </Link>

        <div>
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
            <Key className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Forgot Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {step === 'method' && 'Choose a recovery method'}
            {step === 'input' && 'Enter your details to receive recovery instructions'}
            {step === 'otp' && 'Enter the OTP sent to your phone'}
            {step === 'reset' && 'Set your new password'}
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {step === 'method' && (
          <div className="space-y-4">
            <button
              onClick={() => handleMethodSelect('email')}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <Mail className="h-6 w-6 text-blue-600" />
              <div className="text-left">
                <div className="font-semibold text-gray-900">Email Recovery</div>
                <div className="text-sm text-gray-600">Get a reset link via email</div>
              </div>
            </button>

            <button
              onClick={() => handleMethodSelect('phone')}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <Phone className="h-6 w-6 text-blue-600" />
              <div className="text-left">
                <div className="font-semibold text-gray-900">Phone Recovery (OTP)</div>
                <div className="text-sm text-gray-600">Get an OTP via SMS</div>
              </div>
            </button>

            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                <strong>Note for Students:</strong> Password can only be reset using your parent's phone number via OTP.
              </p>
            </div>
          </div>
        )}

        {step === 'input' && (
          <form className="mt-8 space-y-6" onSubmit={handleSendOTP}>
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">
                {method === 'email' ? 'Email Address' : 'Phone Number'}
              </label>
              <input
                id="identifier"
                name="identifier"
                type={method === 'email' ? 'email' : 'tel'}
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder={method === 'email' ? 'Enter your email' : 'Enter phone number (parent phone for students)'}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep('method');
                  setIdentifier('');
                  setError('');
                }}
                className="flex-1 py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
              >
                {loading ? 'Sending...' : method === 'email' ? 'Send Reset Link' : 'Send OTP'}
              </button>
            </div>
          </form>
        )}

        {step === 'otp' && (
          <form className="mt-8 space-y-6" onSubmit={handleVerifyOTP}>
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                Enter OTP
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-center text-2xl tracking-widest"
                placeholder="000000"
              />
              <p className="mt-2 text-sm text-gray-600 text-center">
                Enter the 6-digit code sent to your phone
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep('input');
                  setOtp('');
                  setError('');
                }}
                className="flex-1 py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </div>
          </form>
        )}

        {step === 'reset' && (
          <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
            <div className="space-y-4">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
