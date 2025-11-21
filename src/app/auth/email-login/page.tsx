'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useViewportHeight } from '@/hooks/useViewportHeight';
import { navigateBackToApp } from '@/utils/androidBridge';

export default function EmailLoginPage() {
  useViewportHeight();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [emailFieldError, setEmailFieldError] = useState(false);

  const handleEmailSubmit = () => {
    if (!email) {
      setErrorMessage('Please fill the fields below to continue');
      setEmailFieldError(true);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address');
      setEmailFieldError(true);
      return;
    }

    // Navigate to password page
    setErrorMessage('');
    setEmailFieldError(false);
    setLoadingEmail(true); // Show loading spinner
    router.push(`/auth/email-login/password?email=${encodeURIComponent(email)}`);
  };

  return (
    <div className="bg-black flex flex-col relative" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      {/* Loading Spinner Overlay */}
      {loadingEmail && (
        <div className="absolute inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div 
            className="animate-spin rounded-full border-4 border-transparent"
            style={{
              width: '48px',
              height: '48px',
              borderTopColor: '#F89880',
              borderRightColor: '#F89880',
            }}
          ></div>
        </div>
      )}

      <div className="flex-1 flex flex-col">
        {/* Spacer for phone status bar */}
        <div className="h-12"></div>
        
        {/* Header */}
        <div className="px-4 py-4 border-b border-[#212321]">
          <button onClick={navigateBackToApp} className="text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 px-3 pt-6 pb-6 flex flex-col relative">
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
                whiteSpace: 'nowrap'
              }}>{errorMessage}</div>
            </div>
          )}
          
          <div className="flex-1 flex flex-col items-start gap-8" style={{ width: '100%' }}>
            <h1 className="text-white text-2xl font-bold" style={{ 
              fontFamily: 'var(--font-montserrat, Montserrat)',
              fontSize: '1.5rem',
              fontWeight: 700,
              lineHeight: '1.75rem'
            }}>Continue with email</h1>
            
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
                      handleEmailSubmit();
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
          </div>
        </div>

        {/* Continue Button */}
        <div className="px-3 pt-4 pb-6 border-t border-[#212321]">
        <button
          onClick={handleEmailSubmit}
          disabled={loadingEmail}
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
