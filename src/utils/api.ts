/**
 * API client for authentication endpoints
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5001';

export interface SendOtpRequest {
  email: string;
}

export interface SendOtpResponse {
  message: string;
  success: boolean;
}

export interface VerifyOtpRequest {
  email: string;
  code: string;
}

export interface VerifyOtpResponse {
  message: string;
  success: boolean;
}

export interface SetPasswordRequest {
  email: string;
  password: string;
}

export interface SetPasswordResponse {
  token: string;
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  message: string;
}

export interface CheckEmailResponse {
  exists: boolean;
  message: string;
}

/**
 * Send OTP to email address
 */
export const sendOtp = async (email: string): Promise<SendOtpResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to send OTP');
  }

  return data;
};

/**
 * Verify OTP code
 */
export const verifyOtp = async (email: string, code: string): Promise<VerifyOtpResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to verify OTP');
  }

  return data;
};

/**
 * Set password for account
 */
export const setPassword = async (email: string, password: string): Promise<SetPasswordResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/set-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to set password');
  }

  return data;
};

/**
 * Check if email exists in the system
 */
export const checkEmailExists = async (email: string): Promise<CheckEmailResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/check-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to check email');
  }

  return data;
};

/**
 * Login with email and password
 */
export const loginWithPassword = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Wrong password');
  }

  return data;
};

