'use client';

import Image from 'next/image';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useViewportHeight } from '@/hooks/useViewportHeight';

function ForgotPasswordResetContent() {
  useViewportHeight();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [passwordFieldError, setPasswordFieldError] = useState(false);
  const [confirmPasswordFieldError, setConfirmPasswordFieldError] = useState(false);

  // Redirect back if no email
  useEffect(() => {
    if (!email) {
      router.push('/auth/forgot-pswd');
    }
  }, [email, router]);

  const handleResetSubmit = async () => {
    let hasError = false;

    if (!password) {
      setPasswordFieldError(true);
      hasError = true;
    }

    if (!confirmPassword) {
      setConfirmPasswordFieldError(true);
      hasError = true;
    }

    if (hasError) {
      setErrorMessage('Please fill the fields below to continue');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      setConfirmPasswordFieldError(true);
      return;
    }

    // Password complexity: min 8 chars, at least one digit and one special character
    const passwordHasNumber = /[0-9]/.test(password);
    const passwordHasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]/.test(password);
    if (password.length < 8 || !passwordHasNumber || !passwordHasSpecial) {
      setErrorMessage('Password must be at least 8 characters and include a number and a special character');
      setPasswordFieldError(true);
      return;
    }

    setLoadingReset(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/password/reset/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      console.log('Set Password Response:', data);

      if (!response.ok) {
        // Check for nested auth0_error message first
        const errorMsg = data.auth0_error?.message || data.message || data.error || 'Failed to reset password';
        setErrorMessage(errorMsg);
        return;
      }

      // Navigate directly to login page on success
      router.push('/auth/email-login');
    } catch (err) {
      console.error('Set Password Error:', err);
      const error = err as Error;
      setErrorMessage(error.message || 'Failed to reset password');
    } finally {
      setLoadingReset(false);
    }
  };

  return (
    <div className="bg-black flex flex-col" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      <div className="flex-1 flex flex-col">
        {/* Spacer for phone status bar */}
        <div className="h-12"></div>
        
        {/* Header */}
        <div className="px-4 py-4 border-b border-[#212321] flex items-center justify-center relative">
          <h2 style={{
            color: 'var(--colors-text-heading, #FFF)',
            textAlign: 'center',
            fontFamily: 'var(--type-font-family-primary, Montserrat)',
            fontSize: 'var(--font-size-body-lg, 1rem)',
            fontStyle: 'normal',
            fontWeight: 700,
            lineHeight: 'var(--line-height-body-lg, 1.25rem)'
          }}>Reset password</h2>
          <button onClick={() => router.push('/auth/forgot-pswd')} className="text-white absolute right-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 px-3 pt-4 pb-6 flex flex-col overflow-y-auto relative">
          {/* Error banner */}
          {errorMessage && (
            <div className="mb-6 bg-[#4d0906] border border-[#b91c1c] rounded-md" style={{
              display: 'flex',
              width: '100%',
              padding: 'var(--spacing-xs, 0.5rem)',
              alignItems: 'center',
              gap: 'var(--spacing-xs, 0.5rem)'
            }}>
              <Image src="/alert.png" alt="alert icon" width={16} height={16} />
              <div style={{
                color: 'var(--colors-text-heading, #FFF)',
                fontFamily: 'var(--type-font-family-primary, Montserrat)',
                fontSize: 'var(--font-size-body-md, 0.875rem)',
                fontStyle: 'normal',
                fontWeight: 400,
                lineHeight: 'var(--line-height-body-md, 1.125rem)',
                whiteSpace: 'normal'
              }}>{errorMessage}</div>
            </div>
          )}

          {/* Icon */}
          <Image src="/pswd.png" alt="password icon" width={48} height={48} className="object-contain mb-4" />

          <h1 className="text-white text-2xl font-bold mb-2">Reset Password</h1>
          <p className="text-gray-400 text-sm mb-8">Please set and confirm your new password</p>

          <div className="flex-1 space-y-6">
            {/* Password */}
            <div>
              <label className="text-white text-sm block mb-2">Password*</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordFieldError) setPasswordFieldError(false);
                    if (errorMessage) setErrorMessage('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      // Focus on confirm password field
                      const confirmInput = document.querySelector('input[placeholder=""]') as HTMLInputElement;
                      if (confirmInput && confirmInput !== e.currentTarget) confirmInput.focus();
                    }
                  }}
                  className={`w-full bg-[#373a37] text-white px-4 py-3 rounded-lg pr-12 focus:outline-none focus:ring-2 focus:ring-gray-600 ${passwordFieldError ? 'border border-red-600' : ''}`}
                  placeholder=""
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
              {passwordFieldError ? (
                <p className="text-red-500 text-xs mt-2">Required field</p>
              ) : (
                <p className="text-gray-500 text-xs mt-2">8 characters minimum</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-white text-sm block mb-2">Confirm password*</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (confirmPasswordFieldError) setConfirmPasswordFieldError(false);
                    if (errorMessage) setErrorMessage('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleResetSubmit();
                    }
                  }}
                  className={`w-full bg-[#373a37] text-white px-4 py-3 rounded-lg pr-12 focus:outline-none focus:ring-2 focus:ring-gray-600 ${confirmPasswordFieldError ? 'border border-red-600' : ''}`}
                  placeholder=""
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showConfirmPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
              {confirmPasswordFieldError && (
                <p className="text-red-500 text-xs mt-2">Required field</p>
              )}
            </div>
          </div>

          {/* Loader overlay */}
          {loadingReset && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border-4 border-t-[#FF9E80] border-gray-700 animate-spin" />
            </div>
          )}
        </div>

        {/* Reset Password Button */}
        <div className="px-3 pt-4 pb-6 border-t border-[#212321]">
          <button
            onClick={handleResetSubmit}
            disabled={loadingReset}
            className="flex justify-center items-center gap-2 rounded-lg transition-colors hover:bg-[#FF8A65]"
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              border: '0 solid #000',
              background: '#F89880',
              color: 'var(--colors-text-on-action-primary, #000)',
              fontFamily: 'var(--type-font-family-primary, Montserrat)',
              fontSize: 'var(--font-size-body-xl, 1.125rem)',
              fontStyle: 'normal',
              fontWeight: 400,
              lineHeight: 'var(--line-height-body-xl, 1.375rem)'
            }}
          >
            Reset password
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordResetPage() {
  return (
    <Suspense fallback={<div className="bg-black" style={{ height: '100vh' }} />}>
      <ForgotPasswordResetContent />
    </Suspense>
  );
}
