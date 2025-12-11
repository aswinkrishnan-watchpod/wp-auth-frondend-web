'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useViewportHeight } from '@/hooks/useViewportHeight';
import { navigateBackToApp } from '@/utils/androidBridge';

export default function ChangePasswordPage() {
  useViewportHeight();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPasswordError, setCurrentPasswordError] = useState(false);
  const [newPasswordError, setNewPasswordError] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);

  const handleForgotPassword = () => {
    router.push('/auth/forgot-pswd');
  };

  const handleChangePassword = async () => {
    // Reset errors
    setErrorMessage('');
    setCurrentPasswordError(false);
    setNewPasswordError(false);
    setConfirmPasswordError(false);

    let hasError = false;

    // Validate required fields
    if (!currentPassword) {
      setCurrentPasswordError(true);
      hasError = true;
    }

    if (!newPassword) {
      setNewPasswordError(true);
      hasError = true;
    }

    if (!confirmPassword) {
      setConfirmPasswordError(true);
      hasError = true;
    }

    if (hasError) {
      setErrorMessage('Please fill the fields below to continue');
      return;
    }

    // Password complexity: min 8 chars, at least one digit and one special character
    const passwordHasNumber = /[0-9]/.test(newPassword);
    const passwordHasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]/.test(newPassword);
    if (newPassword.length < 8 || !passwordHasNumber || !passwordHasSpecial) {
      setErrorMessage('Password must be at least 8 characters and include a number and a special character');
      setNewPasswordError(true);
      return;
    }

    // Check passwords match
    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match');
      setConfirmPasswordError(true);
      return;
    }

    // Check new password is different from current
    if (currentPassword === newPassword) {
      setErrorMessage('New password must be different from current password');
      setNewPasswordError(true);
      return;
    }

    setLoading(true);

    try {
      // Get bearer token from Android bridge
      let accessToken: string | null = null;
      
      if (typeof window !== 'undefined' && window.AndroidBridge?.getAccessToken) {
        try {
          accessToken = window.AndroidBridge.getAccessToken();
          console.log('Got access token from AndroidBridge');
        } catch (e) {
          console.error('Error getting access token from AndroidBridge:', e);
        }
      }

      if (!accessToken) {
        setErrorMessage('Unable to authenticate. Please try again.');
        setLoading(false);
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          old_password: currentPassword,
          new_password: newPassword
        })
      });

      const data = await response.json();
      console.log('Change Password Response:', data);

      if (!response.ok) {
        const errorMsg = data.auth0_error?.message || data.message || data.error || 'Failed to change password';
        setErrorMessage(errorMsg);
        return;
      }

      // Success - notify Android and navigate back to app
      console.log('Password changed successfully');
      
      // Call onPasswordChanged callback if available
      if (typeof window !== 'undefined' && window.AndroidBridge?.onPasswordChanged) {
        try {
          window.AndroidBridge.onPasswordChanged();
          console.log('✓ onPasswordChanged callback executed');
        } catch (e) {
          console.error('Error calling onPasswordChanged:', e);
        }
      }
      
      navigateBackToApp();
    } catch (err) {
      console.error('Change Password Error:', err);
      const error = err as Error;
      setErrorMessage(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black flex flex-col relative" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      {/* Loading Spinner Overlay */}
      {loading && (
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
        <div className="px-4 py-4 border-b border-[#212321] flex items-center justify-center relative">
          <button onClick={navigateBackToApp} className="text-white absolute left-4">
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
          }}>Change password</h2>
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

          <div className="flex-1 space-y-6">
            {/* Current Password */}
            <div>
              <label className="text-gray-400 text-sm block mb-2">Current password</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (currentPasswordError) setCurrentPasswordError(false);
                    if (errorMessage) setErrorMessage('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const newPwdInput = document.getElementById('new-password-input');
                      if (newPwdInput) newPwdInput.focus();
                    }
                  }}
                  className={`w-full bg-[#373a37] text-white px-4 py-3 rounded-lg pr-12 focus:outline-none focus:ring-2 focus:ring-gray-600 ${currentPasswordError ? 'border border-red-600' : ''}`}
                  placeholder=""
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showCurrentPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
              {currentPasswordError && (
                <p className="text-red-500 text-xs mt-2">Required field</p>
              )}
            </div>

            {/* Forgot Password Link */}
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm underline"
              style={{
                color: '#FFF',
                fontFamily: 'var(--type-font-family-primary, Montserrat)',
                fontSize: '0.875rem',
                fontWeight: 400,
                textDecoration: 'underline',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer'
              }}
            >
              Forgot your password?
            </button>

            {/* New Password */}
            <div>
              <label className="text-gray-400 text-sm block mb-2">New password</label>
              <div className="relative">
                <input
                  id="new-password-input"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (newPasswordError) setNewPasswordError(false);
                    if (errorMessage) setErrorMessage('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const confirmInput = document.getElementById('confirm-password-input');
                      if (confirmInput) confirmInput.focus();
                    }
                  }}
                  className={`w-full bg-[#373a37] text-white px-4 py-3 rounded-lg pr-12 focus:outline-none focus:ring-2 focus:ring-gray-600 ${newPasswordError ? 'border border-red-600' : ''}`}
                  placeholder=""
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showNewPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
              {newPasswordError ? (
                <p className="text-red-500 text-xs mt-2">Required field</p>
              ) : null}
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="text-gray-400 text-sm block mb-2">Reenter your new password</label>
              <div className="relative">
                <input
                  id="confirm-password-input"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (confirmPasswordError) setConfirmPasswordError(false);
                    if (errorMessage) setErrorMessage('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleChangePassword();
                    }
                  }}
                  className={`w-full bg-[#373a37] text-white px-4 py-3 rounded-lg pr-12 focus:outline-none focus:ring-2 focus:ring-gray-600 ${confirmPasswordError ? 'border border-red-600' : ''}`}
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
              {confirmPasswordError ? (
                <p className="text-red-500 text-xs mt-2">Required field</p>
              ) : (
                <p className="text-gray-500 text-xs mt-2">Must match your new password above</p>
              )}
            </div>
          </div>
        </div>

        {/* Change Password Button */}
        <div className="px-3 pt-4 pb-6 border-t border-[#212321]">
          <button
            onClick={handleChangePassword}
            disabled={loading}
            className="flex justify-center items-center gap-2 text-black rounded-lg transition-colors hover:bg-[#FF8A65]"
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              border: '0 solid #000',
              background: '#F89880',
              fontFamily: 'var(--type-font-family-primary, Montserrat)',
              fontSize: 'var(--font-size-body-xl, 1.125rem)',
              fontStyle: 'normal',
              fontWeight: 400,
              lineHeight: 'var(--line-height-body-xl, 1.375rem)'
            }}
          >
            Change password
          </button>
        </div>
      </div>
    </div>
  );
}

