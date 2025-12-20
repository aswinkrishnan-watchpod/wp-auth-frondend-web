'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useViewportHeight } from '@/hooks/useViewportHeight';
import { navigateBackToApp } from '@/utils/androidBridge';

export default function DeleteAccountPage() {
  useViewportHeight();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [passwordFieldError, setPasswordFieldError] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleDeleteAccount = async () => {
    // Reset errors
    setErrorMessage('');
    setPasswordFieldError(false);

    // Validate password is provided
    if (!password) {
      setErrorMessage('Please enter your password to continue.');
      setPasswordFieldError(true);
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

      // Get API URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        console.error('NEXT_PUBLIC_API_URL is not set');
        setErrorMessage('API URL is not configured. Please check your environment variables.');
        setLoading(false);
        return;
      }

      const endpoint = `${apiUrl}/api/v1/auth/validate-password`;
      console.log('Validating password at:', endpoint);
      console.log('Request body:', { password: '***' });

      // Validate password
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          password: password
        })
      });

      console.log('Validate Password Response Status:', response.status);

      const data = await response.json();
      console.log('Validate Password Response:', data);

      if (!response.ok) {
        const errorMsg = data.message || data.error || 'Failed to validate password';
        setErrorMessage(errorMsg);
        setPasswordFieldError(true);
        setLoading(false);
        return;
      }

      // Check if password is valid
      if (data.valid === true) {
        // Password is valid, show confirmation modal
        setShowConfirmModal(true);
      } else {
        setErrorMessage('Invalid password. Please try again.');
        setPasswordFieldError(true);
      }
    } catch (err) {
      console.error('Validate Password Error:', err);
      const error = err as Error;
      
      // More specific error messages
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        setErrorMessage('Network error. Please check your internet connection and try again.');
      } else if (error.message.includes('CORS')) {
        setErrorMessage('CORS error. Please check API configuration.');
      } else {
        setErrorMessage(error.message || 'Failed to validate password. Please try again.');
      }
      
      setPasswordFieldError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    setShowConfirmModal(false);
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

      // Get API URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        console.error('NEXT_PUBLIC_API_URL is not set');
        setErrorMessage('API URL is not configured. Please check your environment variables.');
        setLoading(false);
        return;
      }

      const endpoint = `${apiUrl}/api/v1/auth/account`;
      console.log('Deleting account at:', endpoint);
      console.log('Request body:', { password: '***' });

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          password: password
        })
      });

      console.log('Delete Account Response Status:', response.status);

      const data = await response.json();
      console.log('Delete Account Response:', data);

      if (!response.ok) {
        const errorMsg = data.auth0_error?.message || data.message || data.error || 'Failed to delete account';
        setErrorMessage(errorMsg);
        setPasswordFieldError(true);
        setLoading(false);
        return;
      }

      // Success - notify Android and navigate back to app
      console.log('Account deleted successfully');
      
      // Call onAccountDeleted callback if available
      if (typeof window !== 'undefined' && window.AndroidBridge) {
        try {
          const bridge = window.AndroidBridge as typeof window.AndroidBridge & {
            onAccountDeleted?: () => void;
          };
          if (typeof bridge.onAccountDeleted === 'function') {
            bridge.onAccountDeleted();
            console.log('✓ onAccountDeleted callback executed');
          }
        } catch (e) {
          console.error('Error calling onAccountDeleted:', e);
        }
      }
      
      navigateBackToApp();
    } catch (err) {
      console.error('Delete Account Error:', err);
      const error = err as Error;
      
      // More specific error messages
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        setErrorMessage('Network error. Please check your internet connection and try again.');
      } else if (error.message.includes('CORS')) {
        setErrorMessage('CORS error. Please check API configuration.');
      } else {
        setErrorMessage(error.message || 'Failed to delete account. Please try again.');
      }
      
      setPasswordFieldError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmModal(false);
  };

  const handleReturnToAccount = () => {
    setShowConfirmModal(false);
    // Close webview and navigate to native account page
    navigateBackToApp();
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
          }}>Delete account</h2>
        </div>

        {/* Content */}
        <div className="flex-1 px-3 pt-4 pb-6 flex flex-col overflow-y-auto relative">
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

          {/* Trash Icon */}
          <div className="flex justify-start mb-6">
            <Image src="/trash.png" alt="trash icon" width={48} height={48} className="object-contain" />
          </div>

          {/* Warning Message */}
          <h1 className="text-white text-base font-normal mb-6" style={{
            fontFamily: 'var(--type-font-family-primary, Montserrat)',
            fontSize: 'var(--font-size-body-md, 1rem)',
            lineHeight: 'var(--line-height-body-md, 1.125rem)',
            textAlign: 'left',
            whiteSpace: 'pre-line'
          }}>
            You&apos;re about to delete your account.{'\n'}This action is irreversible. all your matches,{'\n'} pods and information will be permanently{'\n'} deleted.
          </h1>

          {/* Password Prompt */}
          <p className="mb-4" style={{
            fontFamily: 'var(--type-font-family-primary, Montserrat)',
            fontSize: 'var(--font-size-body-md, 1rem)',
            fontWeight: 400,
            color: '#9B9C9B'
          }}>
            Enter your password to continue
          </p>

          {/* Password Field */}
          <div className="mb-6">
            <label className="text-sm block mb-2" style={{ color: '#9B9C9B' }}>Password</label>
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
                    handleDeleteAccount();
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
              <p className="text-red-500 text-xs mt-2">Required field</p>
            )}
          </div>
        </div>

        {/* Confirm and Delete Button */}
        <div className="px-3 pt-4 pb-6 border-t border-[#212321]">
          <button
            onClick={handleDeleteAccount}
            disabled={loading}
            className="flex justify-center items-center gap-2 rounded-lg transition-colors hover:bg-[#FF8A65]"
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              border: '0 solid #000',
              background: '#F89880',
              color: '#000',
              fontFamily: 'var(--type-font-family-primary, Montserrat)',
              fontSize: 'var(--font-size-body-xl, 1.125rem)',
              fontStyle: 'normal',
              fontWeight: 400,
              lineHeight: 'var(--line-height-body-xl, 1.375rem)'
            }}
          >
            Confirm and delete
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/80 z-50"
            onClick={handleCancelDelete}
          />
          
          {/* Modal */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-black rounded-t-2xl" style={{
            borderTop: '1px solid #212321',
            maxHeight: '75vh'
          }}>
            <div className="px-4 pt-6 pb-6">
              {/* Header with close button */}
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-white font-bold" style={{
                  fontFamily: 'var(--type-font-family-primary, Montserrat)',
                  fontSize: 'var(--font-size-body-lg, 1rem)',
                  fontWeight: 700,
                  lineHeight: 'var(--line-height-body-lg, 1.25rem)'
                }}>
                  Are you sure? By deleting your account
                </h3>
                <button
                  onClick={handleCancelDelete}
                  className="text-white ml-4 flex-shrink-0"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Warning Message */}
              <p className="text-white mb-6" style={{
                fontFamily: 'var(--type-font-family-primary, Montserrat)',
                fontSize: 'var(--font-size-body-md, 0.875rem)',
                fontWeight: 400,
                lineHeight: 'var(--line-height-body-md, 1.125rem)'
              }}>
                You won&apos;t be able to revert this action and all your data, including profile, pods will be lost.
              </p>

              {/* Action Buttons */}
              <div className="space-y-6">
                {/* Divider */}
                <div className="border-t border-[#212321] pt-3">
                  {/* No, return to account button */}
                  <button
                    onClick={handleReturnToAccount}
                    className="w-full rounded-lg transition-colors hover:bg-[#FF8A65]"
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '0.5rem',
                      background: '#F89880',
                      color: '#000',
                      fontFamily: 'var(--type-font-family-primary, Montserrat)',
                      fontSize: 'var(--font-size-body-lg, 1rem)',
                      fontWeight: 400,
                      lineHeight: 'var(--line-height-body-lg, 1.25rem)'
                    }}
                  >
                    No, return to account
                  </button>
                </div>

                {/* Yes, delete account link */}
                <button
                  onClick={handleConfirmDelete}
                  className="w-full text-white underline text-center"
                  style={{
                    fontFamily: 'var(--type-font-family-primary, Montserrat)',
                    fontSize: 'var(--font-size-body-md, 0.875rem)',
                    fontWeight: 400,
                    lineHeight: 'var(--line-height-body-md, 1.125rem)',
                    background: 'transparent',
                    border: 'none',
                    padding: '0.5rem 0 1rem 0',
                    textDecoration: 'underline',
                    cursor: 'pointer'
                  }}
                >
                  Yes, delete account
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

