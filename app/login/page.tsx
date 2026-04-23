'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, RefreshCw, CheckCircle } from 'lucide-react';
import OTPInput from '@/components/auth/OTPInput';

type AuthStep = 'login' | 'forgot-password' | 'otp-verification' | 'reset-password';

interface ForgotPasswordState {
  email: string;
  otp: string;
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Multi-step auth state
  const [currentStep, setCurrentStep] = useState<AuthStep>('login');
  const [forgotPasswordState, setForgotPasswordState] = useState<ForgotPasswordState>({
    email: '',
    otp: '',
    resetToken: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [stepLoading, setStepLoading] = useState(false);
  const [stepError, setStepError] = useState('');
  const [stepSuccess, setStepSuccess] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Redirect if already logged in
  useEffect(() => {
    if (status === 'authenticated' && session) {
      const redirectTo = searchParams?.get('redirect') || '/admin';
      router.replace(redirectTo);
    }
  }, [session, status, router, searchParams]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Don't render login form if already authenticated
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (status === 'authenticated') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to admin panel...</p>
        </div>
      </div>
    );
  }

  const validateLoginForm = (): string | null => {
    if (!email.trim()) {
      return 'Email is required';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Please enter a valid email address';
    }
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return null;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateLoginForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        switch (result.error) {
          case 'CredentialsSignin':
            setError('Invalid email or password. Please check your credentials and try again.');
            break;
          default:
            setError('Login failed. Please check your credentials and try again.');
        }
      } else if (result?.ok) {
        const redirectTo = searchParams?.get('redirect') || '/admin';
        router.replace(redirectTo);
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forgotPasswordState.email.trim()) {
      setStepError('Please enter your email address');
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotPasswordState.email)) {
      setStepError('Please enter a valid email address');
      return;
    }

    setStepLoading(true);
    setStepError('');
    setStepSuccess('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotPasswordState.email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (data.success) {
        setStepSuccess('OTP has been sent to your email address. Please check your inbox.');
        setCurrentStep('otp-verification');
        setResendCooldown(60); // 1 minute cooldown
      } else {
        if (data.blocked) {
          setStepError(`Too many attempts. Please try again in ${data.remainingTime} minutes.`);
        } else {
          setStepError(data.error || 'Failed to send OTP. Please try again.');
        }
      }
    } catch (error) {
      setStepError('Network error. Please try again.');
    } finally {
      setStepLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forgotPasswordState.otp || forgotPasswordState.otp.length !== 6) {
      setStepError('Please enter the complete 6-digit OTP');
      return;
    }

    setStepLoading(true);
    setStepError('');

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: forgotPasswordState.email.trim().toLowerCase(),
          otp: forgotPasswordState.otp 
        }),
      });

      const data = await response.json();

      if (data.success) {
        setForgotPasswordState(prev => ({ ...prev, resetToken: data.resetToken }));
        setStepSuccess('OTP verified successfully. Please set your new password.');
        setCurrentStep('reset-password');
      } else {
        setStepError(data.error || 'Invalid OTP. Please try again.');
        
        if (data.code === 'OTP_EXPIRED' || data.code === 'OTP_NOT_FOUND') {
          // Allow user to request new OTP
          setResendCooldown(0);
        }
      }
    } catch (error) {
      setStepError('Network error. Please try again.');
    } finally {
      setStepLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forgotPasswordState.newPassword || forgotPasswordState.newPassword.length < 8) {
      setStepError('Password must be at least 8 characters long');
      return;
    }

    if (forgotPasswordState.newPassword !== forgotPasswordState.confirmPassword) {
      setStepError('Passwords do not match');
      return;
    }

    // Password strength validation
    const hasUpperCase = /[A-Z]/.test(forgotPasswordState.newPassword);
    const hasLowerCase = /[a-z]/.test(forgotPasswordState.newPassword);
    const hasNumbers = /\d/.test(forgotPasswordState.newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      setStepError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return;
    }

    setStepLoading(true);
    setStepError('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotPasswordState.email.trim().toLowerCase(),
          resetToken: forgotPasswordState.resetToken,
          newPassword: forgotPasswordState.newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStepSuccess('Password has been reset successfully! You can now login with your new password.');
        // Reset form and go back to login after 3 seconds
        setTimeout(() => {
          setCurrentStep('login');
          setForgotPasswordState({
            email: '',
            otp: '',
            resetToken: '',
            newPassword: '',
            confirmPassword: ''
          });
          setStepSuccess('');
          setStepError('');
        }, 3000);
      } else {
        setStepError(data.error || 'Failed to reset password. Please try again.');
      }
    } catch (error) {
      setStepError('Network error. Please try again.');
    } finally {
      setStepLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;

    setStepLoading(true);
    setStepError('');

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotPasswordState.email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (data.success) {
        setStepSuccess('A new OTP has been sent to your email address.');
        setResendCooldown(60);
        setForgotPasswordState(prev => ({ ...prev, otp: '' }));
      } else {
        setStepError(data.error || 'Failed to resend OTP. Please try again.');
      }
    } catch (error) {
      setStepError('Network error. Please try again.');
    } finally {
      setStepLoading(false);
    }
  };

  const resetToLogin = () => {
    setCurrentStep('login');
    setForgotPasswordState({
      email: '',
      otp: '',
      resetToken: '',
      newPassword: '',
      confirmPassword: ''
    });
    setStepError('');
    setStepSuccess('');
    setResendCooldown(0);
  };

  const renderLoginForm = () => (
    <form onSubmit={handleLogin} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
            placeholder=""
            required
            disabled={loading}
            autoComplete="email"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
            placeholder=""
            required
            disabled={loading}
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center">
          <input 
            type="checkbox" 
            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" 
            disabled={loading}
          />
          <span className="ml-2 text-sm text-gray-600">Remember me</span>
        </label>
        <button
          type="button"
          onClick={() => setCurrentStep('forgot-password')}
          className="text-sm text-gray-800 hover:text-gray-900 transition-colors"
          disabled={loading}
        >
          Forgot password?
        </button>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );

  const renderForgotPasswordForm = () => (
    <form onSubmit={handleForgotPassword} className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Reset Password</h2>
        <p className="text-gray-600 mt-2">Enter your email to receive an OTP</p>
      </div>

      {stepError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{stepError}</span>
        </div>
      )}

      {stepSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{stepSuccess}</span>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="email"
            value={forgotPasswordState.email}
            onChange={(e) => setForgotPasswordState(prev => ({ ...prev, email: e.target.value }))}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
            placeholder=""
            required
            disabled={stepLoading}
            autoComplete="email"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={resetToLogin}
          className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center gap-2"
          disabled={stepLoading}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </button>
        <button
          type="submit"
          disabled={stepLoading}
          className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:bg-gray-400 transition-colors"
        >
          {stepLoading ? 'Sending...' : 'Send OTP'}
        </button>
      </div>
    </form>
  );

  const renderOTPVerificationForm = () => (
    <form onSubmit={handleVerifyOTP} className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Verify OTP</h2>
        <p className="text-gray-600 mt-2">Enter the 6-digit code sent to your email</p>
        <p className="text-sm text-gray-600 mt-1">{forgotPasswordState.email}</p>
      </div>

      {stepError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{stepError}</span>
        </div>
      )}

      {stepSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{stepSuccess}</span>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
          Enter OTP Code
        </label>
        <OTPInput
          value={forgotPasswordState.otp}
          onChange={(value) => setForgotPasswordState(prev => ({ ...prev, otp: value }))}
          disabled={stepLoading}
          error={!!stepError}
          autoFocus
        />
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={handleResendOTP}
          disabled={resendCooldown > 0 || stepLoading}
          className="text-sm text-gray-800 hover:text-gray-900 transition-colors disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
        </button>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setCurrentStep('forgot-password')}
          className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center gap-2"
          disabled={stepLoading}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          type="submit"
          disabled={stepLoading || forgotPasswordState.otp.length !== 6}
          className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:bg-gray-400 transition-colors"
        >
          {stepLoading ? 'Verifying...' : 'Verify OTP'}
        </button>
      </div>
    </form>
  );

  const renderResetPasswordForm = () => (
    <form onSubmit={handleResetPassword} className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Set New Password</h2>
        <p className="text-gray-600 mt-2">Create a strong password for your account</p>
      </div>

      {stepError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{stepError}</span>
        </div>
      )}

      {stepSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{stepSuccess}</span>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          New Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="password"
            value={forgotPasswordState.newPassword}
            onChange={(e) => setForgotPasswordState(prev => ({ ...prev, newPassword: e.target.value }))}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
            placeholder=""
            required
            disabled={stepLoading}
            autoComplete="new-password"
            minLength={8}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">Must contain uppercase, lowercase, and numbers</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Confirm New Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="password"
            value={forgotPasswordState.confirmPassword}
            onChange={(e) => setForgotPasswordState(prev => ({ ...prev, confirmPassword: e.target.value }))}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
            placeholder=""
            required
            disabled={stepLoading}
            autoComplete="new-password"
            minLength={8}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={stepLoading}
        className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:bg-gray-400 transition-colors"
      >
        {stepLoading ? 'Resetting Password...' : 'Reset Password'}
      </button>
    </form>
  );

  const getCurrentForm = () => {
    switch (currentStep) {
      case 'login':
        return renderLoginForm();
      case 'forgot-password':
        return renderForgotPasswordForm();
      case 'otp-verification':
        return renderOTPVerificationForm();
      case 'reset-password':
        return renderResetPasswordForm();
      default:
        return renderLoginForm();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md border border-gray-200">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">ePaper CMS</h1>
          <p className="text-gray-600 mt-2">
            {currentStep === 'login' ? 'Admin Panel Login' : 'Password Recovery'}
          </p>
        </div>

        {getCurrentForm()}

        {currentStep === 'login' && (
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Use your registered email and password to login</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
