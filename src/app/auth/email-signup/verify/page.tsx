'use client';

import Image from 'next/image';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useViewportHeight } from '@/hooks/useViewportHeight';

function EmailSignupVerifyContent() {
  useViewportHeight();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [verificationCode, setVerificationCode] = useState('');
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [verificationFieldError, setVerificationFieldError] = useState(false);

  // Redirect back if no email
  useEffect(() => {
    if (!email) {
      router.push('/auth/email-signup');
    }
  }, [email, router]);

  const handleVerificationSubmit = async () => {
    if (!verificationCode) {
      setErrorMessage('Please fill the fields below to continue');
      setVerificationFieldError(true);
      return;
    }

    setErrorMessage('');
    setVerificationFieldError(false);
    setLoadingVerify(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: verificationCode })
      });

      const data = await response.json();
      console.log('Verify OTP Response:', data);

      if (!response.ok) {
        setErrorMessage(data.message || data.error || 'Invalid verification code');
        setVerificationFieldError(true);
        return;
      }

      // Navigate to password page
      router.push(`/auth/email-signup/password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      console.error('Verify OTP Error:', err);
      const error = err as Error;
      setErrorMessage(error.message || 'Invalid verification code');
      setVerificationFieldError(true);
    } finally {
      setLoadingVerify(false);
    }
  };

  const handleResendCode = async () => {
    setErrorMessage('');
    setLoadingVerify(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      console.log('Resend OTP Response:', data);

      if (!response.ok) {
        setErrorMessage(data.message || data.error || 'Failed to resend code');
        return;
      }

      console.log('Verification code resent');
    } catch (err) {
      console.error('Resend OTP Error:', err);
      const error = err as Error;
      setErrorMessage(error.message || 'Failed to resend verification code');
    } finally {
      setLoadingVerify(false);
    }
  };

  return (
    <div className="bg-black flex flex-col" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      <div className="flex-1 flex flex-col">
        {/* Spacer for phone status bar */}
        <div className="h-12"></div>
        
        {/* Header */}
        <div className="px-4 py-4 border-b border-[#212321]">
          <button onClick={() => router.push('/auth/email-signup')} className="text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 px-3 pt-4 pb-6 flex flex-col relative">
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
          
          {/* Icon */}
          <Image src="/email.png" alt="email icon" width={48} height={48} className="object-contain mb-4" />

          <h1 className="text-white mb-4" style={{
            fontFamily: 'var(--font-montserrat, Montserrat)',
            fontSize: '1.5rem',
            fontWeight: 700,
            lineHeight: '1.75rem'
          }}>Please verify your email address</h1>
          <p className="text-gray-400 text-sm mb-2">
            We&apos;ve sent a one-time code to <span className="text-white">{email}</span>. The code will expire in 10 minutes.
          </p>

          <div className="flex-1 mt-8">
            <label className="text-gray-400 text-sm block mb-2">Verification code</label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => {
                setVerificationCode(e.target.value);
                if (verificationFieldError) setVerificationFieldError(false);
                if (errorMessage) setErrorMessage('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleVerificationSubmit();
                }
              }}
              className={`w-full bg-[#373a37] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600 ${verificationFieldError ? 'border border-red-600' : ''}`}
              placeholder=""
            />

            {verificationFieldError && (
              <p className="text-red-500 text-xs mt-2">Required field</p>
            )}

            <div className="mt-4 flex justify-end">
              <p style={{
                color: 'var(--colors-text-body, #9B9C9B)',
                fontFamily: 'var(--type-font-family-primary, Montserrat)',
                fontSize: 'var(--font-size-body-sm, 0.75rem)',
                fontStyle: 'normal',
                fontWeight: 400,
                lineHeight: 'var(--line-height-body-sm, 1rem)'
              }}>
                Don&apos;t see an email? <button onClick={handleResendCode} className="text-white underline">Resend</button>
              </p>
            </div>
          </div>

          {/* Loader overlay */}
          {loadingVerify && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border-4 border-t-[#FF9E80] border-gray-700 animate-spin" />
            </div>
          )}
        </div>

        {/* Continue Button with top border */}
        <div className="px-3 pt-4 pb-6 border-t border-[#212321]">
          <button
            onClick={handleVerificationSubmit}
            disabled={loadingVerify}
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

export default function EmailSignupVerifyPage() {
  return (
    <Suspense fallback={<div className="bg-black" style={{ height: '100vh' }} />}>
      <EmailSignupVerifyContent />
    </Suspense>
  );
}
