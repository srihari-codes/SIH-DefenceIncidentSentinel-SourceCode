import { useState, useRef, useCallback, useEffect } from "react";
import { OTP_EXPIRY_SECONDS, sanitizeOtpInput, isValidOtpFormat } from "@/lib/auth/emailOtp";
import type { OtpState } from "@/lib/auth/types";

interface UseEmailOtpOptions {
  expirySeconds?: number;
  onExpire?: () => void;
  onSend?: (email: string) => Promise<boolean> | boolean;
}

interface UseEmailOtpReturn extends OtpState {
  sendOtp: (email: string) => Promise<boolean>;
  verifyOtp: () => boolean;
  setOtpCode: (value: string) => void;
  setOtpError: (error: string) => void;
  resetOtp: () => void;
  isExpired: boolean;
  canResend: boolean;
}

export const useEmailOtp = (options: UseEmailOtpOptions = {}): UseEmailOtpReturn => {
  const { expirySeconds = OTP_EXPIRY_SECONDS, onExpire, onSend } = options;

  const [otpCode, setOtpCodeRaw] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpError, setOtpError] = useState("");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startCountdown = useCallback(() => {
    clearTimer();
    setOtpCountdown(expirySeconds);

    timerRef.current = setInterval(() => {
      setOtpCountdown((prev) => {
        if (prev <= 1) {
          clearTimer();
          onExpire?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimer, expirySeconds, onExpire]);

  const setOtpCode = useCallback((value: string) => {
    const sanitized = sanitizeOtpInput(value);
    setOtpCodeRaw(sanitized);
    if (otpError) {
      setOtpError("");
    }
  }, [otpError]);

  const sendOtp = useCallback(async (email: string): Promise<boolean> => {
    if (!email || !email.trim()) {
      setOtpError("Email is required to receive OTP.");
      return false;
    }

    // Call custom send handler if provided
    if (onSend) {
      const result = await onSend(email);
      if (!result) {
        return false;
      }
    }

    setOtpError("");
    setOtpCodeRaw("");
    setOtpSent(true);
    startCountdown();
    return true;
  }, [onSend, startCountdown]);

  const verifyOtp = useCallback((): boolean => {
    if (!otpSent) {
      setOtpError("Please request an OTP first.");
      return false;
    }

    if (otpCountdown === 0) {
      setOtpError("OTP has expired. Please request a new one.");
      return false;
    }

    if (!isValidOtpFormat(otpCode)) {
      setOtpError("Please enter a valid 6-digit code.");
      return false;
    }

    // In production, actual verification happens server-side
    // This just validates the format client-side
    return true;
  }, [otpSent, otpCountdown, otpCode]);

  const resetOtp = useCallback(() => {
    clearTimer();
    setOtpCodeRaw("");
    setOtpSent(false);
    setOtpCountdown(0);
    setOtpError("");
  }, [clearTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return {
    otpCode,
    otpSent,
    otpCountdown,
    otpError,
    sendOtp,
    verifyOtp,
    setOtpCode,
    setOtpError,
    resetOtp,
    isExpired: otpSent && otpCountdown === 0,
    canResend: otpCountdown === 0,
  };
};

export default useEmailOtp;
