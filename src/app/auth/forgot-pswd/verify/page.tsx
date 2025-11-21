'use client';

import Image from 'next/image';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useViewportHeight } from '@/hooks/useViewportHeight';

function ForgotPasswordVerifyContent() {
  useViewportHeight();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState('');
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [otpFieldError, setOtpFieldError] = useState(false);

  // Redirect back if no email
  useEffect(() => {
    if (!email) {
      router.push('/auth/forgot-pswd');
    }
  }, [email, router]);

  const handleOtpSubmit = async () => {
    if (!otp) {
      setErrorMessage('Please enter the verification code');
      setOtpFieldError(true);
      return;
    }

    setErrorMessage('');
    setOtpFieldError(false);
    setLoadingOtp(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/password/reset/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });

      const data = await response.json();
      console.log('Verify OTP Response:', data);

      if (!response.ok) {
        setErrorMessage(data.message || data.error || 'Invalid verification code');
        setOtpFieldError(true);
        return;
      }

      // Navigate to reset password page
      router.push(`/auth/forgot-pswd/reset?email=${encodeURIComponent(email)}`);
    } catch (err) {
      console.error('Verify OTP Error:', err);
      const error = err as Error;
      setErrorMessage(error.message || 'Wrong code');
      setOtpFieldError(true);
    } finally {
      setLoadingOtp(false);
    }
  };

  const handleResendCode = async () => {
    setLoadingOtp(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      console.log('Resend OTP Response:', data);

      if (!response.ok) {
        alert(data.message || data.error || 'Failed to resend code. Please try again.');
        return;
      }

      alert('Verification code sent!');
    } catch (err) {
      console.error('Resend OTP Error:', err);
      const error = err as Error;
      alert(error.message || 'Failed to resend code. Please try again.');
    } finally {
      setLoadingOtp(false);
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
          <button onClick={() => router.push('/auth/forgot-pswd')} className="text-white absolute right-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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

          {/* Icon */}
          <Image src="/email.png" alt="email icon" width={48} height={48} className="object-contain mb-4" />

          <h1 className="text-white mb-4" style={{
            fontFamily: 'var(--font-montserrat, Montserrat)',
            fontSize: '1.5rem',
            fontWeight: 700,
            lineHeight: '1.75rem'
          }}>OTP Verification</h1>
          <p className="text-gray-400 text-sm mb-2">
            Please enter the code we sent to your email
          </p>

          <div className="flex-1 mt-8">
            <label className="text-gray-400 text-sm block mb-2">Confirmation code</label>
            <div className="relative">
              <input
                type="text"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value);
                  if (otpFieldError) setOtpFieldError(false);
                  if (errorMessage) setErrorMessage('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleOtpSubmit();
                  }
                }}
                className={`w-full bg-[#373a37] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600 ${otpFieldError ? 'border border-red-600' : ''}`}
                placeholder=""
              />
            </div>
            {otpFieldError && (
              <p className="text-red-500 text-xs mt-2">Required field</p>
            )}

            <div className="mt-4 flex justify-end items-center text-sm">
              <button onClick={handleResendCode} className="text-[#F89880] hover:underline">
                Resend code
              </button>
            </div>
          </div>

          {/* Loader overlay */}
          {loadingOtp && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border-4 border-t-[#FF9E80] border-gray-700 animate-spin" />
            </div>
          )}
        </div>

        {/* Continue Button */}
        <div className="px-3 pt-4 pb-6 border-t border-[#212321]">
          <button
            onClick={handleOtpSubmit}
            disabled={loadingOtp}
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
            Set password
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordVerifyPage() {
  return (
    <Suspense fallback={<div className="bg-black" style={{ height: '100vh' }} />}>
      <ForgotPasswordVerifyContent />
    </Suspense>
  );
}
