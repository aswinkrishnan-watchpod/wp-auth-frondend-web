'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useViewportHeight } from '@/hooks/useViewportHeight';
import { navigateBackToApp } from '@/utils/androidBridge';
import { notifyLoginSuccess } from '@/utils/androidBridge';

export default function EmailLoginPage() {
  useViewportHeight();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [emailFieldError, setEmailFieldError] = useState(false);
  const [passwordFieldError, setPasswordFieldError] = useState(false);

  const handleLoginSubmit = async () => {
    // Reset errors
    setErrorMessage('');
    setEmailFieldError(false);
    setPasswordFieldError(false);

    let hasError = false;

    if (!email) {
      setEmailFieldError(true);
      hasError = true;
    }

    if (!password) {
      setPasswordFieldError(true);
      hasError = true;
    }

    if (hasError) {
      setErrorMessage('Please fill the fields below to continue');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address');
      setEmailFieldError(true);
      return;
    }

    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ;
      
      console.log('Attempting login to:', `${apiUrl}/api/v1/auth/login`);
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
        const errorMsg = data.message || data.error || 'Wrong password';
        setErrorMessage(errorMsg);
        setPasswordFieldError(true);
        return;
      }

      // Pass the access token to Android app
      if (data.access_token) {
        console.log('Login successful, token received');
        notifyLoginSuccess(data.access_token, email);
      } else {
        console.error('No access token in response:', data);
        setErrorMessage('No access token received');
      }
    } catch (err) {
      console.error('Login error:', err);
      const error = err as Error;
      setErrorMessage(error.message || 'Wrong password');
      setPasswordFieldError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black flex flex-col relative" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      <div className="flex-1 flex flex-col">
        {/* Spacer for phone status bar */}
        <div className="h-12"></div>
        
        {/* Header */}
        <div className="px-4 py-4 border-b border-[#212321] flex items-center justify-center relative">
          <button onClick={navigateBackToApp} className="text-white absolute left-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
        </div>

        {/* Content */}
        <div className="flex-1 px-3 pt-6 pb-6 flex flex-col overflow-y-auto relative">
          {/* Error banner */}
          {errorMessage && (
            <div className="mb-6 bg-[#4d0906] border border-[#b91c1c] rounded-md" style={{
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
          
          <div className="flex-1 flex flex-col items-start gap-6" style={{ width: '100%' }}>
            <h1 className="text-white text-2xl font-bold" style={{ 
              fontFamily: 'var(--font-montserrat, Montserrat)',
              fontSize: '1.5rem',
              fontWeight: 700,
              lineHeight: '1.75rem'
            }}>Sign in</h1>
            
            {/* Email Field */}
            <div className="w-full">
              <label className="text-gray-400 text-sm block mb-2">Email address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailFieldError) setEmailFieldError(false);
                    if (errorMessage) setErrorMessage('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const passwordInput = document.getElementById('password-input');
                      if (passwordInput) passwordInput.focus();
                    }
                  }}
                  className={`w-full bg-[#373a37] text-white px-4 py-3 rounded-lg pr-12 focus:outline-none focus:ring-2 focus:ring-gray-600 ${emailFieldError ? 'border border-red-600' : ''}`}
                  placeholder=""
                />
                <svg 
                  className="w-6 h-6 text-white absolute right-4 top-1/2 -translate-y-1/2" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              {emailFieldError && (
                <p className="text-red-500 text-xs mt-2">Required field</p>
              )}
            </div>

            {/* Password Field */}
            <div className="w-full">
              <label className="text-gray-400 text-sm block mb-2">Password</label>
              <div className="relative">
                <input
                  id="password-input"
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
                      handleLoginSubmit();
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
              
              {/* Forgot password link */}
              <div className="mt-4 w-full flex justify-end">
                <Link href="/auth/forgot-pswd" className="text-[#F89880] text-sm hover:underline">
                  Forgot password?
                </Link>
              </div>
            </div>
          </div>

          {/* Loader overlay */}
          {loading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border-4 border-t-[#FF9E80] border-gray-700 animate-spin" />
            </div>
          )}
        </div>

        {/* Sign in Button */}
        <div className="px-3 pt-4 pb-6 border-t border-[#212321]">
          <button
            onClick={handleLoginSubmit}
            disabled={loading}
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
