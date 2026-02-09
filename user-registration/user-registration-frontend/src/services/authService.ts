/**
 * Authentication Service
 * Progressive multi-step authentication API with signed HttpOnly cookies
 * 
 * Login Flow: identity → password → mfa (3 steps)
 * Registration Flow: identity → service → security → activate (4 steps)
 * 
 * All cookies (login_challenge, registration_challenge, access_token, refresh_token)
 * are handled automatically by the browser via credentials: 'include'
 */

import { API_ENDPOINTS } from "@/lib/constants";
import type {
  RoleKey,
  LoginIdentityRequest,
  LoginIdentityResponse,
  LoginPasswordRequest,
  LoginPasswordResponse,
  LoginMfaRequest,
  LoginMfaResponse,
  RegisterIdentitySendRequest,
  RegisterIdentitySubmitRequest,
  RegisterIdentityResponse,
  RegisterServiceRequest,
  RegisterServiceResponse,
  RegisterSecurityRequest,
  RegisterSecurityResponse,
  RegisterActivateGenerateTotpRequest,
  RegisterActivateSendOtpRequest,
  RegisterActivateVerifyTotpRequest,
  RegisterActivateVerifyEmailRequest,
  RegisterActivateTotpSetupResponse,
  RegisterActivateCompleteResponse,
  RegisterActivateOtpSentResponse,
  ExchangeAuthCodeRequest,
  ExchangeAuthCodeResponse,
} from "@/types";

// =============================================================================
// HELPER: Generic API Call with Cookie Support
// =============================================================================

interface ApiError {
  message: string;
  code?: string;
}

async function apiCall<T>(
  endpoint: string,
  data: object
): Promise<{ success: boolean; data?: T; error?: ApiError }> {
  try {
    // Get access token from localStorage for cross-domain auth
    const accessToken = localStorage.getItem('access_token');
    
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken && { "Authorization": `Bearer ${accessToken}` }),
      },
      credentials: "include", // Critical: sends HttpOnly cookies
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: { message: result.message || "Request failed", code: result.code },
      };
    }

    return { success: true, data: result as T };
  } catch (error: unknown) {
    console.error(`[AuthService] API call failed:`, error);
    return {
      success: false,
      error: { message: error instanceof Error ? error.message : "Network error" },
    };
  }
}

// =============================================================================
// LOGIN FLOW (3 Steps)
// =============================================================================

/**
 * Step 1: Verify identity (role, identifier, email)
 * Server sets login_challenge cookie on success
 */
export async function loginIdentity(
  request: LoginIdentityRequest
): Promise<{ success: boolean; data?: LoginIdentityResponse; error?: ApiError }> {
  console.log("[AuthService] Login Step 1: Identity verification", {
    role: request.role,
    identifier: request.identifier,
  });
  return apiCall<LoginIdentityResponse>(API_ENDPOINTS.AUTH.LOGIN_IDENTITY, request);
}

/**
 * Step 2: Verify password
 * Requires login_challenge cookie (auto-sent)
 * Server updates login_challenge cookie with new stage
 */
export async function loginPassword(
  request: LoginPasswordRequest
): Promise<{ success: boolean; data?: LoginPasswordResponse; error?: ApiError }> {
  console.log("[AuthService] Login Step 2: Password verification");
  return apiCall<LoginPasswordResponse>(API_ENDPOINTS.AUTH.LOGIN_PASSWORD, request);
}

/**
 * Step 3: MFA verification
 * Requires login_challenge cookie with PASSWORD stage (auto-sent)
 * On success: Server sets access_token and refresh_token cookies
 */
export async function loginMfa(
  request: LoginMfaRequest
): Promise<{ success: boolean; data?: LoginMfaResponse; error?: ApiError }> {
  console.log("[AuthService] Login Step 3: MFA verification", {
    method: request.method,
    action: request.action,
  });
  return apiCall<LoginMfaResponse>(API_ENDPOINTS.AUTH.LOGIN_MFA, request);
}

/**
 * Helper: Send Email OTP for login MFA (Family/Veteran roles)
 */
export async function loginSendEmailOtp(): Promise<{
  success: boolean;
  data?: LoginMfaResponse;
  error?: ApiError;
}> {
  return loginMfa({ method: "EMAIL", action: "send_otp" });
}

// =============================================================================
// REGISTRATION FLOW (4 Steps)
// =============================================================================

/**
 * Step 1a: Send email verification code
 */
export async function registerSendEmailVerification(
  email: string
): Promise<{ success: boolean; data?: RegisterIdentityResponse; error?: ApiError }> {
  console.log("[AuthService] Register Step 1a: Sending email verification to", email);
  const request: RegisterIdentitySendRequest = {
    email,
    action: "send_verification",
  };
  return apiCall<RegisterIdentityResponse>(API_ENDPOINTS.AUTH.REGISTER_IDENTITY, request);
}

/**
 * Step 1b: Submit identity with verified email
 * Server sets registration_challenge cookie on success
 */
export async function registerIdentity(
  request: RegisterIdentitySubmitRequest
): Promise<{ success: boolean; data?: RegisterIdentityResponse; error?: ApiError }> {
  console.log("[AuthService] Register Step 1b: Identity submission", {
    email: request.email,
    full_name: request.full_name,
  });
  return apiCall<RegisterIdentityResponse>(API_ENDPOINTS.AUTH.REGISTER_IDENTITY, request);
}

/**
 * Step 2: Submit service credentials (role + identifier)
 * Requires registration_challenge cookie (auto-sent)
 */
export async function registerService(
  request: RegisterServiceRequest
): Promise<{ success: boolean; data?: RegisterServiceResponse; error?: ApiError }> {
  console.log("[AuthService] Register Step 2: Service credentials", {
    role: request.role,
    identifier: request.identifier,
  });
  return apiCall<RegisterServiceResponse>(API_ENDPOINTS.AUTH.REGISTER_SERVICE, request);
}

/**
 * Step 3: Submit security setup (password, MFA method, terms)
 * Requires registration_challenge cookie (auto-sent)
 */
export async function registerSecurity(
  request: RegisterSecurityRequest
): Promise<{ success: boolean; data?: RegisterSecurityResponse; error?: ApiError }> {
  console.log("[AuthService] Register Step 3: Security setup", {
    mfa_method: request.mfa_method,
    terms_accepted: request.terms_accepted,
  });
  return apiCall<RegisterSecurityResponse>(API_ENDPOINTS.AUTH.REGISTER_SECURITY, request);
}

/**
 * Step 4a: Generate TOTP setup (for TOTP roles)
 * Returns QR code, manual key, and backup codes
 */
export async function registerGenerateTotp(): Promise<{
  success: boolean;
  data?: RegisterActivateTotpSetupResponse;
  error?: ApiError;
}> {
  console.log("[AuthService] Register Step 4a: Generating TOTP setup");
  const request: RegisterActivateGenerateTotpRequest = { action: "generate_totp" };
  return apiCall<RegisterActivateTotpSetupResponse>(API_ENDPOINTS.AUTH.REGISTER_ACTIVATE, request);
}

/**
 * Step 4b: Send activation OTP (for Email OTP roles)
 */
export async function registerSendActivationOtp(): Promise<{
  success: boolean;
  data?: RegisterActivateOtpSentResponse;
  error?: ApiError;
}> {
  console.log("[AuthService] Register Step 4b: Sending activation OTP");
  const request: RegisterActivateSendOtpRequest = { action: "send_otp" };
  return apiCall<RegisterActivateOtpSentResponse>(API_ENDPOINTS.AUTH.REGISTER_ACTIVATE, request);
}

/**
 * Step 4c: Verify TOTP and complete registration (for TOTP roles)
 * Admin can include extra fields
 */
export async function registerActivateWithTotp(
  request: RegisterActivateVerifyTotpRequest
): Promise<{ success: boolean; data?: RegisterActivateCompleteResponse; error?: ApiError }> {
  console.log("[AuthService] Register Step 4c: Verifying TOTP and activating");
  return apiCall<RegisterActivateCompleteResponse>(API_ENDPOINTS.AUTH.REGISTER_ACTIVATE, request);
}

/**
 * Step 4d: Verify Email OTP and complete registration (for Email OTP roles)
 */
export async function registerActivateWithEmailOtp(
  code: string
): Promise<{ success: boolean; data?: RegisterActivateCompleteResponse; error?: ApiError }> {
  console.log("[AuthService] Register Step 4d: Verifying Email OTP and activating");
  const request: RegisterActivateVerifyEmailRequest = { email_otp_code: code };
  return apiCall<RegisterActivateCompleteResponse>(API_ENDPOINTS.AUTH.REGISTER_ACTIVATE, request);
}

// =============================================================================
// AUTHORIZATION CODE EXCHANGE (OAuth-like flow)
// =============================================================================

/**
 * Exchange authorization code for access tokens
 * Used after successful login/registration redirect to dashboard
 */
export async function exchangeAuthCode(
  code: string
): Promise<{ success: boolean; data?: ExchangeAuthCodeResponse; error?: ApiError }> {
  console.log("[AuthService] Exchanging authorization code for tokens");
  const request: ExchangeAuthCodeRequest = { code };
  return apiCall<ExchangeAuthCodeResponse>(API_ENDPOINTS.AUTH.EXCHANGE_CODE, request);
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  // Login flow
  loginIdentity,
  loginPassword,
  loginMfa,
  loginSendEmailOtp,
  // Registration flow
  registerSendEmailVerification,
  registerIdentity,
  registerService,
  registerSecurity,
  registerGenerateTotp,
  registerSendActivationOtp,
  registerActivateWithTotp,
  registerActivateWithEmailOtp,
  // Authorization code exchange
  exchangeAuthCode,
};
