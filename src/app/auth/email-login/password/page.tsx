'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useViewportHeight } from '@/hooks/useViewportHeight';
import { notifyLoginSuccess } from '@/utils/androidBridge';

function EmailLoginPasswordContent() {
  useViewportHeight();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [passwordFieldError, setPasswordFieldError] = useState(false);

  // Redirect back if no email
  useEffect(() => {
    if (!email) {
      router.push('/auth/email-login');
    }
  }, [email, router]);

  const handlePasswordSubmit = async () => {
    if (!password) {
      setErrorMessage('Please fill the fields below to continue');
      setPasswordFieldError(true);
      return;
    }

    setErrorMessage('');
    setPasswordFieldError(false);
    setLoadingPassword(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5001';
      
      console.log('Attempting login to:', `${apiUrl}/users/login`);
      console.log('Request body:', { email, password: '***' });

      const response = await fetch(`${apiUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();
      
      // Debug logging
      console.log('Login response status:', response.status);
      console.log('Login response data:', data);

      if (!response.ok) {
        console.error('Login failed:', data);
        throw new Error(data.message || 'Wrong password');
      }

      // Pass the access token to Android app
      if (data.access_token) {
        console.log('Login successful, token received');
        notifyLoginSuccess(data.access_token, email);
      } else {
        console.error('No access token in response:', data);
        throw new Error('No access token received');
      }
    } catch (err) {
      console.error('Login error:', err);
      const error = err as Error;
      setErrorMessage(error.message || 'Wrong password');
      setPasswordFieldError(true);
    } finally {
      setLoadingPassword(false);
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
          }}>Set password</h2>
          <button onClick={() => router.push('/auth/email-login')} className="text-white absolute right-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 px-3 pt-4 pb-6 flex flex-col relative">
          {/* Error banner - Show first if present */}
          {errorMessage && (
            <div className="mb-6 bg-[#4d0906] border border-[#b91c1c] rounded-md mx-3" style={{
              display: 'flex',
              width: '100%',
              padding: 'var(--spacing-xs, 0.5rem)',
              paddingTop: '0.75rem',
              paddingBottom: '0.75rem',
              minHeight: '3rem',
              alignItems: 'flex-start',
              gap: 'var(--spacing-xs, 0.5rem)',
              whiteSpace: 'normal',
              overflowWrap: 'anywhere',
              wordBreak: 'break-word'
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

          <h1 className="text-white mb-2" style={{
            fontFamily: 'var(--font-montserrat, Montserrat)',
            fontSize: '1.5rem',
            fontWeight: 700,
            lineHeight: '1.75rem'
          }}>Enter your password</h1>

          <div className="flex-1 mt-8">
            <label className="text-gray-400 text-sm block mb-2">Enter password</label>
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
                    handlePasswordSubmit();
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
            {passwordFieldError && (
              <p className="text-red-500 text-xs mt-2">Wrong password</p>
            )}
            
            {/* Forgot password link (right aligned) */}
            <div className="mt-4 w-full flex justify-end">
              <Link href="/auth/forgot-pswd" className="text-[#F89880] text-sm hover:underline">
                Forgot password?
              </Link>
            </div>
          </div>

          {/* Loader overlay */}
          {loadingPassword && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border-4 border-t-[#FF9E80] border-gray-700 animate-spin" />
            </div>
          )}
        </div>

        {/* Set Password Button */}
        <div className="px-3 pt-4 pb-6 border-t border-[#212321]">
          <button
            onClick={handlePasswordSubmit}
            disabled={loadingPassword}
            className="flex justify-center items-center gap-2 text-black rounded-lg transition-colors hover:bg-[#FF8A65]"
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              border: '0 solid #000',
              background: '#F89880',
              fontFamily: 'var(--font-montserrat, Montserrat)',
              fontSize: '1.125rem',
              fontWeight: 400,
              lineHeight: '1.375rem'
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EmailLoginPasswordPage() {
  return (
    <Suspense fallback={<div className="bg-black" style={{ height: '100vh' }} />}>
      <EmailLoginPasswordContent />
    </Suspense>
  );
}
