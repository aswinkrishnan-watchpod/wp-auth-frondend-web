'use client';

import Image from 'next/image';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useViewportHeight } from '@/hooks/useViewportHeight';
import { navigateBackToApp } from '@/utils/androidBridge';

function EmailSignupPasswordContent() {
  useViewportHeight();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showVerifiedBanner, setShowVerifiedBanner] = useState(true);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [passwordFieldError, setPasswordFieldError] = useState(false);
  const [confirmPasswordFieldError, setConfirmPasswordFieldError] = useState(false);
  const [isGoogleSignup, setIsGoogleSignup] = useState(false);

  // Get idToken from AndroidBridge if available (for Google signup flow)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.AndroidBridge?.getIdToken) {
      try {
        const token = window.AndroidBridge.getIdToken();
        console.log('Got idToken from AndroidBridge:', token?.substring(0, 20) + '...');
        setIsGoogleSignup(!!token);
      } catch (e) {
        console.error('Error getting idToken from AndroidBridge:', e);
      }
    }
  }, []);

  // Auto-hide verified banner after 2 seconds
  useEffect(() => {
    if (showVerifiedBanner) {
      const timer = setTimeout(() => {
        setShowVerifiedBanner(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [showVerifiedBanner]);

  // Redirect back if no email
  useEffect(() => {
    if (!email) {
      router.push('/auth/email-signup');
    }
  }, [email, router]);

  // Handle back button click based on signup type
  const handleBackClick = () => {
    if (isGoogleSignup) {
      // If Google signup, navigate back to Android app
      console.log('Google signup detected, navigating back to app');
      navigateBackToApp();
    } else {
      // If normal email signup, go back to email entry page
      console.log('Normal email signup, going back to email entry');
      router.push('/auth/email-signup');
    }
  };

  const handlePasswordSubmit = async () => {
    // Client-side validation
    if (!password || !confirmPassword) {
      setErrorMessage('Please fill the fields below to continue');
      if (!password) setPasswordFieldError(true);
      if (!confirmPassword) setConfirmPasswordFieldError(true);
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long');
      setPasswordFieldError(true);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      setPasswordFieldError(true);
      setConfirmPasswordFieldError(true);
      return;
    }

    setErrorMessage('');
    setPasswordFieldError(false);
    setConfirmPasswordFieldError(false);
    setLoadingPassword(true);

    try {
      // Check for idToken directly from AndroidBridge (don't rely on state)
      let currentIdToken: string | null = null;
      
      console.log('=== Checking for AndroidBridge ===');
      console.log('typeof window:', typeof window);
      console.log('window.AndroidBridge exists:', !!window.AndroidBridge);
      
      if (typeof window !== 'undefined') {
        console.log('window.AndroidBridge:', window.AndroidBridge);
        console.log('window.AndroidBridge?.getIdToken:', window.AndroidBridge?.getIdToken);
        console.log('typeof window.AndroidBridge?.getIdToken:', typeof window.AndroidBridge?.getIdToken);
      }
      
      if (typeof window !== 'undefined' && window.AndroidBridge?.getIdToken) {
        try {
          currentIdToken = window.AndroidBridge.getIdToken();
          console.log('✓ Got idToken from AndroidBridge:', currentIdToken?.substring(0, 20) + '...');
          console.log('✓ idToken length:', currentIdToken?.length);
        } catch (e) {
          console.error('✗ Error calling window.AndroidBridge.getIdToken():', e);
        }
      } else {
        console.warn('✗ window.AndroidBridge.getIdToken not available');
      }

      // Determine which endpoint to use based on whether we have an idToken
      const isGoogleSignup = !!currentIdToken;
      const endpoint = isGoogleSignup 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/social/password/set`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/password`;

      // Build request body
      const requestBody: Record<string, string> = { email, password };
      if (isGoogleSignup && currentIdToken) {
        requestBody.id_token = currentIdToken;
      }

      console.log('=== API Call Details ===');
      console.log('Endpoint:', endpoint);
      console.log('Is Google signup:', isGoogleSignup);
      console.log('Request body keys:', Object.keys(requestBody));
      console.log('Has id_token:', 'id_token' in requestBody);

      // Build headers - add Authorization header if we have an idToken
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (isGoogleSignup && currentIdToken) {
        headers['Authorization'] = `Bearer ${currentIdToken}`;
        console.log('Added Authorization header with Bearer token');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      console.log('Set Password Response:', data);

      if (!response.ok) {
        // Check for nested auth0_error message first
        const errorMsg = data.auth0_error?.message || data.message || data.error || 'Failed to set password';
        setErrorMessage(errorMsg);
        return;
      }

      if (data.access_token) {
        // Use the same bridge method for both Google and regular email signup
        try {
          const { notifySignupSuccessWithEmail } = await import('@/utils/androidBridge');
          await notifySignupSuccessWithEmail(data.access_token, email);
          console.log(`✓ notifySignupSuccessWithEmail called successfully (${isGoogleSignup ? 'Google' : 'Email'} signup)`);
        } catch (e) {
          console.error('notifySignupSuccessWithEmail failed, falling back to notifySignupSuccess', e);
          try {
            const payload = JSON.stringify({ access_token: data.access_token, email });
            const { notifySignupSuccess } = await import('@/utils/androidBridge');
            await notifySignupSuccess(payload);
          } catch (e2) {
            console.error('Fallback notifySignupSuccess also failed', e2);
          }
        }
      } else {
        setErrorMessage('No access token received');
      }
    } catch (err) {
      console.error('Set Password Error:', err);
      const error = err as Error;
      setErrorMessage(error.message || 'Failed to set password');
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
          <button onClick={handleBackClick} className="text-white absolute left-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 style={{
            color: 'var(--colors-text-heading, #FFF)',
            textAlign: 'center',
            fontFamily: 'var(--type-font-family-primary, Montserrat)',
            fontSize: 'var(--font-size-body-lg, 1rem)',
            fontStyle: 'normal',
            fontWeight: 700,
            lineHeight: 'var(--line-height-body-lg, 1.25rem)'
          }}>Set password</h2>
        </div>

        {/* Content */}
        <div className="flex-1 px-3 pt-4 pb-6 flex flex-col relative">
          {/* Error banner - Show first if present */}
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
                whiteSpace: 'nowrap'
              }}>{errorMessage}</div>
            </div>
          )}

          {/* Success Banner - Only show if no error and showVerifiedBanner is true */}
          {showVerifiedBanner && !errorMessage && (
            <div className="px-4 py-3 mb-6 flex items-center gap-3" style={{
              borderRadius: 'var(--border-radius-sm, 0.25rem)',
              border: 'var(--border-width-sm, 1px) solid var(--color-green-160, #235414)',
              background: 'var(--success-170, #1A3F0F)'
            }}>
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-white flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className="text-white text-sm font-medium">Email verified!</span>
            </div>
          )}

          {/* Icon */}
          <Image src="/pswd.png" alt="password icon" width={48} height={48} className="object-contain mb-4" />

          <h1 className="text-white text-2xl font-bold mb-2">Set your password</h1>
          <p className="text-gray-400 text-sm mb-8">Required fields are marked with an asterisk (*)</p>

          <div className="flex-1 space-y-6">
            {/* Create Password */}
            <div>
              <label className="text-white text-sm block mb-2">Create password</label>
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
                      const confirmInput = document.querySelector('input[type="password"]:not([value="' + password + '"])') as HTMLInputElement;
                      if (confirmInput) confirmInput.focus();
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
              <label className="text-white text-sm block mb-2">Confirm password</label>
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
                      handlePasswordSubmit();
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
              {confirmPasswordFieldError ? (
                <p className="text-red-500 text-xs mt-2">Required field</p>
              ) : (
                <p className="text-gray-500 text-xs mt-2">Must match your password above</p>
              )}
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
            Set password
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EmailSignupPasswordPage() {
  return (
    <Suspense fallback={<div className="bg-black" style={{ height: '100vh' }} />}>
      <EmailSignupPasswordContent />
    </Suspense>
  );
}
