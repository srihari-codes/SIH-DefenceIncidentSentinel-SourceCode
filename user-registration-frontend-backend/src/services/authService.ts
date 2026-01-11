/**
 * Authentication Service
 * Handles API calls for authentication with backend
 */

import type { SendOtpRequest, VerifyOtpRequest, OtpResponse, AuthUser } from "@/lib/auth/types";
import { verifyTotpToken } from "@/lib/auth/totpService";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

/**
 * Send OTP to email
 */
export const sendOtp = async (request: SendOtpRequest): Promise<OtpResponse> => {
  // Mock implementation - replace with actual API call
  // Example: return fetch(`${API_BASE_URL}/auth/send-otp`, { method: 'POST', body: JSON.stringify(request) })
  
  console.log(`[AuthService] Sending OTP to ${request.email} for ${request.purpose}`);
  
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Mock success response
  return {
    success: true,
    message: `OTP sent to ${request.email}`,
    expiresIn: 60,
  };
};

/**
 * Verify OTP
 */
export const verifyOtp = async (request: VerifyOtpRequest): Promise<OtpResponse> => {
  // Mock implementation - replace with actual API call
  // Example: return fetch(`${API_BASE_URL}/auth/verify-otp`, { method: 'POST', body: JSON.stringify(request) })
  
  console.log(`[AuthService] Verifying OTP for ${request.email}`);
  
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Mock validation (accepts any 6-digit code for demo)
  if (request.otpCode.length === 6) {
    return {
      success: true,
      message: "OTP verified successfully",
    };
  }

  return {
    success: false,
    message: "Invalid OTP code",
  };
};

/**
 * Login with credentials
 */
export const login = async (credentials: {
  identifier: string;
  email?: string;
  password: string;
  role: string;
}): Promise<{ success: boolean; user?: AuthUser; message: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Login failed',
      };
    }

    return {
      success: data.success,
      user: data.user,
      message: data.message,
    };
  } catch (error: any) {
    console.error('[AuthService] Login error:', error);
    return {
      success: false,
      message: error.message || 'Login failed',
    };
  }
};

/**
 * Complete MFA verification
 */
export const verifyMfa = async (params: {
  userId: string;
  method: "totp" | "email";
  code: string;
  totpSecret?: string; // TOTP secret for verification
}): Promise<{ success: boolean; token?: string; message: string }> => {
  try {
    // For TOTP, verify locally first for quick feedback
    if (params.method === "totp" && params.totpSecret) {
      const isValid = verifyTotpToken(params.code, params.totpSecret);
      
      if (!isValid) {
        return {
          success: false,
          message: "Invalid verification code",
        };
      }
    }

    // Call backend to complete MFA and get JWT token
    const response = await fetch(`${API_BASE_URL}/auth/verify-mfa`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: params.userId,
        code: params.code,
        method: params.method,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'MFA verification failed',
      };
    }

    return {
      success: data.success,
      token: data.token,
      message: data.message,
    };
  } catch (error: any) {
    console.error('[AuthService] MFA verification error:', error);
    return {
      success: false,
      message: error.message || 'MFA verification failed',
    };
  }
};

/**
 * Register new user
 */
export const register = async (userData: {
  fullName: string;
  email: string;
  mobile: string;
  serviceId: string;
  role: string;
  password: string;
  mfaMethod: "totp" | "email";
  totpSecret?: string;
  backupCodes?: string[];
}): Promise<{ success: boolean; message: string; token?: string; user?: any }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    return data;
  } catch (error: any) {
    console.error('[AuthService] Registration error:', error);
    return {
      success: false,
      message: error.message || 'Registration failed',
    };
  }
};

export default {
  sendOtp,
  verifyOtp,
  login,
  verifyMfa,
  register,
};
