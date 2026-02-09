import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LucideIcon } from "lucide-react";
import { Shield, Smartphone, CheckCircle2, Clock, Info, Eye, EyeOff, ArrowLeft, Users, Medal, Radar, Cpu, ChevronDown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { roleConfigurations, roleOptions, RoleKey, RoleConfig, defenceEmailPattern } from "@/lib/roleConfig";
import { cn } from "@/lib/utils";
import { useAuthPreview } from "./AuthLayout";
import type { TotpSetup } from "@/lib/auth/totpService";
import {
  registerSendEmailVerification,
  registerIdentity,
  registerService,
  registerSecurity,
  registerGenerateTotp,
  registerSendActivationOtp,
  registerActivateWithTotp,
  registerActivateWithEmailOtp,
} from "@/services/authService";
import "./register-preview.css";
import "./auth-stepper.css";

const BASE_PASSWORD_POLICY = "Minimum 12 characters, at least one uppercase letter, one number, and one special character.";
const PASSWORD_POLICY_REGEX = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{12,}$/;
const formatCountdown = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const getRoleBasedRedirect = (role: RoleKey): string => {
  // Defence Personnel, Family Member/Dependent, Veteran/Retired Officer
  if (role === "personnel" || role === "family" || role === "veteran") {
    return "https://cyber-complaint-portal.vercel.app/";
  }
  // CERT Analyst - placeholder for now
  if (role === "cert") {
    return "/dashboard/cert"; // Will be updated later
  }
  // Admin / MoD Authority
  if (role === "admin") {
    return "https://cert-dashbord.vercel.app";
  }
  return "/dashboard";
};

const roleAvatarIconMap: Record<RoleKey, LucideIcon> = {
  personnel: Shield,
  family: Users,
  veteran: Medal,
  cert: Radar,
  admin: Cpu,
};

const RegisterForm = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [userType, setUserType] = useState<RoleKey | "">("");
  const [serviceId, setServiceId] = useState("");
  const [serviceIdError, setServiceIdError] = useState("");
  const [mfaMethod, setMfaMethod] = useState<"totp" | "email">("totp");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [activationPassword, setActivationPassword] = useState("");
  const [activationPasswordError, setActivationPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [emailOtpError, setEmailOtpError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const otpTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [hasActivatedPreview, setHasActivatedPreview] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailWarning, setEmailWarning] = useState("");
  const [totpSetup, setTotpSetup] = useState<TotpSetup | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [totpError, setTotpError] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  // Email verification for Step 1
  const [emailVerificationOtp, setEmailVerificationOtp] = useState("");
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [emailVerificationCountdown, setEmailVerificationCountdown] = useState(0);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [emailVerificationError, setEmailVerificationError] = useState("");
  const emailVerificationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast } = useToast();

  const steps = [
    { id: 1, title: "Identity", description: "Who are you?" },
    { id: 2, title: "Service", description: "Defence credentials" },
    { id: 3, title: "Security", description: "MFA & consent" },
    { id: 4, title: "Activate", description: "Secure account" },
  ];

  const currentRoleConfig = useMemo<RoleConfig | undefined>(
    () => (userType ? roleConfigurations[userType] : undefined),
    [userType]
  );

  const roleSecurityMessages = useMemo(
    () =>
      currentRoleConfig
        ? [
            ...(currentRoleConfig.securityNotes ?? []),
            ...(currentRoleConfig.highPrivilege ? ["High-privilege monitoring enabled."] : []),
            ...(currentRoleConfig.readOnlyRole ? ["Access is read-only after approval."] : []),
          ]
        : [],
    [currentRoleConfig]
  );

  const minRequiredPasswordLength = useMemo(
    () => Math.max(12, currentRoleConfig?.passwordPolicy?.minLength ?? 12),
    [currentRoleConfig?.passwordPolicy?.minLength]
  );

  const baselinePasswordMessage = useMemo(
    () =>
      minRequiredPasswordLength > 12
        ? `Minimum ${minRequiredPasswordLength} characters, at least one uppercase letter, one number, and one special character.`
        : BASE_PASSWORD_POLICY,
    [minRequiredPasswordLength]
  );

  const passwordPolicyMessages = useMemo(() => {
    const messages = new Set<string>([baselinePasswordMessage]);
    const customMessage = currentRoleConfig?.passwordPolicy?.message;
    if (customMessage && customMessage !== baselinePasswordMessage) {
      messages.add(customMessage);
    }
    return Array.from(messages);
  }, [baselinePasswordMessage, currentRoleConfig?.passwordPolicy?.message]);

  const roleDisplayName = useMemo(
    () => roleOptions.find((option) => option.value === userType)?.label ?? "Select role",
    [userType]
  );

  const idLabel = currentRoleConfig?.idLabel ?? "Credential ID";

  const initials = useMemo(() => {
    if (!fullName.trim()) {
      return "DF";
    }
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [fullName]);

  const roleAvatarIcon = useMemo(() => (userType ? roleAvatarIconMap[userType as RoleKey] : undefined), [userType]);
  const RoleAvatarIconComponent = roleAvatarIcon;

  const maskedMobile = useMemo(() => {
    const normalized = mobile.replace(/\D/g, "");
    if (!normalized) {
      return "Awaiting mobile number";
    }
    if (normalized.length < 4) {
      return "Awaiting full mobile number";
    }
    return `***-***-${normalized.slice(-4)}`;
  }, [mobile]);

  const currentStepTitle = steps.find((step) => step.id === currentStep)?.title ?? "Overview";

  const progressPercentage = useMemo(() => {
    const cappedStep = Math.min(currentStep, 4);
    return Math.round((cappedStep / 4) * 100);
  }, [currentStep]);

  const { setPreviewContent, setPreviewActive } = useAuthPreview();

  const previewStage = Math.min(currentStep, 4);
  const isTotpSetupActive = showMFASetup && mfaMethod === "totp";
  const isVerifying = isSubmitted && !isVerified && !emailError;

  const previewContent = useMemo(
    () => (
      <div className="space-y-4">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.32em] text-[hsl(213,100%,18%)]/60">
          <span>Stage {previewStage} of 4</span>
          <span>{currentStepTitle}</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-[hsl(213,100%,18%)]/12">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[hsl(207,90%,54%)] to-[hsl(213,100%,18%)]"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="relative mx-auto w-[420px] max-w-full">
          <div className="absolute -top-10 left-6 h-24 w-24 rounded-full bg-white/40 blur-3xl" />
          <div className="absolute -bottom-12 right-8 h-28 w-28 rounded-full bg-[hsl(207,90%,80%)]/40 blur-3xl" />
          <div className="relative [perspective:1600px]">
            <div
              className="relative h-[260px] w-full transition-transform duration-700 ease-out"
              style={{ transformStyle: "preserve-3d", transform: isTotpSetupActive ? "rotateY(180deg)" : "rotateY(0deg)" }}
            >
              <div
                className="absolute inset-0 flex flex-col justify-between overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-br from-white via-[#f3f7ff] to-[#d7e6ff] p-8 text-[hsl(213,100%,18%)] shadow-[0_18px_55px_-28px_rgba(15,23,42,0.85)]"
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className={`generate-overlay ${isVerifying ? "generate-overlay--verifying" : ""}`} aria-hidden="true" />
                {isVerifying ? (
                  <div className="flex h-full flex-col justify-between gap-4 animate-pulse">
                    <div className="flex items-start justify-between gap-6">
                      <div className="space-y-3 flex-1">
                        <div className="h-3 w-32 rounded bg-[hsl(213,100%,18%)]/20" />
                        <div className="space-y-2">
                          <div className="h-5 w-48 rounded bg-[hsl(213,100%,18%)]/25" />
                          <div className="h-3 w-36 rounded bg-[hsl(213,100%,18%)]/15" />
                        </div>
                      </div>
                      <div className="h-16 w-16 rounded-full border border-[hsl(213,100%,18%)]/10 bg-white/60" />
                    </div>
                    <div className="space-y-3">
                      <div className="h-3 w-full rounded bg-[hsl(213,100%,18%)]/15" />
                      <div className="h-3 w-3/4 rounded bg-[hsl(213,100%,18%)]/10" />
                    </div>
                    <div className="h-3 w-40 rounded bg-[hsl(213,100%,18%)]/20" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-6">
                      <div className="space-y-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-[hsl(213,100%,18%)]/55">
                          Defence Incident Sentinel 
                        </p>
                        <div>
                          <p className="text-2xl font-semibold leading-tight tracking-wide">
                            {fullName.trim() || "Your Defence Name"}
                          </p>
                          <p className="text-xs uppercase tracking-[0.32em] text-[hsl(213,100%,18%)]/60">
                            {roleDisplayName}
                          </p>
                        </div>
                      </div>
                      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[hsl(213,100%,18%)]/20 bg-white/80 text-[hsl(213,100%,18%)]">
                        {RoleAvatarIconComponent ? (
                          <RoleAvatarIconComponent className="h-8 w-8" />
                        ) : (
                          <span className="text-lg font-semibold tracking-wide">{initials}</span>
                        )}
                      </div>
                    </div>

                    <dl className="space-y-2 text-sm">
                      <div className="flex items-center justify-between gap-6">
                        <dt className="text-[hsl(213,100%,18%)]/55">{idLabel}</dt>
                        <dd className="font-semibold tracking-wide text-[hsl(213,100%,18%)]">
                          {serviceId.trim() || "Pending ID"}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-6">
                        <dt className="text-[hsl(213,100%,18%)]/55">Contact</dt>
                        <dd className="font-semibold tracking-wide text-[hsl(213,100%,18%)]">{maskedMobile}</dd>
                      </div>
                    </dl>

                    <div className="text-[11px] uppercase tracking-[0.36em] text-[hsl(213,100%,18%)]/55">
                      {email.trim() || "name@defence.mil.in"}
                    </div>
                  </>
                )}
              </div>

              <div
                className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-br from-white via-[#f3f7ff] to-[#d7e6ff] p-8 shadow-[0_18px_55px_-28px_rgba(15,23,42,0.85)]"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <div className={`generate-overlay ${isVerifying ? "generate-overlay--verifying" : ""}`} aria-hidden="true" />
                {totpSetup && isTotpSetupActive && (
                  <div className="flex items-center justify-center">
                    <img 
                      src={totpSetup.qrCodeDataUrl} 
                      alt="TOTP QR Code" 
                      className="w-48 h-48 rounded-lg shadow-lg"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {isVerifying ? (
          <p className="text-[11px] font-semibold text-[hsl(213,100%,18%)]/80">
            Verification in progress… hold steady while we confirm your credentials.
          </p>
        ) : isTotpSetupActive ? (
          <p className="text-[11px] text-[hsl(213,100%,18%)]/65 max-w-[260px]">
            Scan the QR code with your authenticator app. Codes refresh every 30 seconds.
          </p>
        ) : (
          <p className="text-[11px] text-[hsl(213,100%,18%)]/65">
            Preview mirrors your inputs in real time. Details finalize after verification.
          </p>
        )}
      </div>
    ),
    [RoleAvatarIconComponent, currentStepTitle, email, fullName, idLabel, initials, isTotpSetupActive, isVerifying, maskedMobile, previewStage, progressPercentage, roleDisplayName, serviceId]
  );

  const hasStartedFilling = useMemo(
    () =>
      Boolean(
        fullName.trim() ||
          email.trim() ||
          mobile.trim() ||
          serviceId.trim() ||
          activationPassword ||
          userType ||
          currentStep > 1
      ),
    [fullName, email, mobile, serviceId, activationPassword, userType, currentStep]
  );

  useEffect(() => {
    if (!hasActivatedPreview && hasStartedFilling) {
      setHasActivatedPreview(true);
    }
  }, [hasActivatedPreview, hasStartedFilling]);

  useEffect(() => {
    setPreviewActive(hasActivatedPreview);
    return () => setPreviewActive(false);
  }, [hasActivatedPreview, setPreviewActive]);

  useEffect(() => {
    if (hasActivatedPreview) {
      setPreviewContent(previewContent);
    } else {
      setPreviewContent(null);
    }
  }, [hasActivatedPreview, previewContent, setPreviewContent]);

  const clearOtpTimer = () => {
    if (otpTimerRef.current) {
      clearInterval(otpTimerRef.current);
      otpTimerRef.current = null;
    }
  };

  const startOtpCountdown = () => {
    clearOtpTimer();
    setOtpCountdown(60);
    otpTimerRef.current = setInterval(() => {
      setOtpCountdown((prev) => {
        if (prev <= 1) {
          clearOtpTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async () => {
    if (!email || !email.trim()) {
      toast({
        title: "Update Email Address",
        description: "Enter a valid email address in Step 1 so we can deliver the OTP.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Call registerSendActivationOtp API (cookie auto-sent)
      const result = await registerSendActivationOtp();

      if (result.success && result.data) {
        setEmailOtp("");
        setEmailOtpError("");
        setOtpSent(true);
        const expiresIn = result.data.expiresIn || 300;
        setOtpCountdown(expiresIn);
        startOtpCountdown();
        toast({
          title: "OTP Sent",
          description: result.data.message || `A one-time code has been dispatched to ${email}.`,
        });
      } else {
        toast({
          title: "Failed to Send OTP",
          description: result.error?.message || "Could not send OTP. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Send OTP error:", error);
      toast({
        title: "OTP Error",
        description: "An error occurred while sending OTP. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Email Verification Functions for Step 1
  const clearEmailVerificationTimer = () => {
    if (emailVerificationTimerRef.current) {
      clearInterval(emailVerificationTimerRef.current);
      emailVerificationTimerRef.current = null;
    }
  };

  const startEmailVerificationCountdown = () => {
    clearEmailVerificationTimer();
    setEmailVerificationCountdown(60);
    emailVerificationTimerRef.current = setInterval(() => {
      setEmailVerificationCountdown((prev) => {
        if (prev <= 1) {
          clearEmailVerificationTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendEmailVerification = async () => {
    if (!email || !email.trim()) {
      toast({
        title: "Email Required",
        description: "Enter your email address first.",
        variant: "destructive",
      });
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await registerSendEmailVerification(email.trim().toLowerCase());

      if (result.success && result.data) {
        setEmailVerificationOtp("");
        setEmailVerificationError("");
        setEmailVerificationSent(true);
        setIsEmailVerified(false);
        const expiresIn = result.data.expiresIn || 300;
        setEmailVerificationCountdown(expiresIn);
        startEmailVerificationCountdown();
        toast({
          title: "Verification Code Sent",
          description: result.data.message || `A 6-digit verification code has been sent to ${email}.`,
        });
      } else {
        toast({
          title: "Failed to Send Code",
          description: result.error?.message || "Could not send verification code. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Email verification send error:", error);
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleVerifyEmail = async () => {
    if (emailVerificationOtp.length !== 6) {
      setEmailVerificationError("Enter the 6-digit code sent to your email.");
      return;
    }

    if (emailVerificationCountdown === 0) {
      setEmailVerificationError("Code expired. Please request a new one.");
      return;
    }

    try {
      const result = await registerIdentity({
        email: email.trim().toLowerCase(),
        full_name: fullName,
        mobile,
        email_verification_code: emailVerificationOtp,
      });

      if (result.success && result.data) {
        clearEmailVerificationTimer();
        setIsEmailVerified(true);
        setEmailVerificationError("");
        toast({
          title: "Email Verified",
          description: result.data.message || "Your email has been successfully verified.",
        });
      } else {
        setEmailVerificationError(result.error?.message || "Invalid code. Please try again.");
        toast({
          title: "Verification Failed",
          description: result.error?.message || "Invalid verification code.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Email verification error:", error);
      setEmailVerificationError("An error occurred. Please try again.");
      toast({
        title: "Verification Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEmailVerificationOtpChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 6);
    setEmailVerificationOtp(cleaned);
    if (emailVerificationError) {
      setEmailVerificationError("");
    }
  };

  const computeNormalizedId = (value: string, config?: RoleConfig) => {
    if (!config) {
      return value.trim();
    }
    if (config.inputType === "email") {
      return value.trim().toLowerCase();
    }
    const cleaned = value.replace(/\s+/g, "");
    return config.enforceUppercase === false ? cleaned.trim() : cleaned.toUpperCase();
  };

  const resetEmailMessages = () => {
    setEmailError("");
    setEmailWarning("");
  };

  const evaluateEmailAgainstRole = (
    config?: RoleConfig,
    providedEmail?: string,
    roleKey?: RoleKey
  ) => {
    resetEmailMessages();

    if (!config) {
      return;
    }

    const candidate = (providedEmail ?? email).trim().toLowerCase();
    if (!candidate) {
      return;
    }

    if (config.emailWhitelist && !config.emailWhitelist.includes(candidate)) {
      setEmailError("Email not listed in the approved roster.");
      return;
    }

    if (config.requiresDefenceEmail && config.emailPattern && !config.emailPattern.test(candidate)) {
      setEmailError(config.emailErrorMessage ?? "Official defence email required.");
      return;
    }

    if (config.emailPattern && !config.emailPattern.test(candidate)) {
      if (config.emailWarningMessage) {
        setEmailWarning(config.emailWarningMessage);
      }
      return;
    }

    if (roleKey === "family" && !defenceEmailPattern.test(candidate)) {
      setEmailWarning(
        config.emailWarningMessage ?? "Non-defence email detected. Manual verification required."
      );
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    evaluateEmailAgainstRole(currentRoleConfig, value, userType || undefined);
    // Reset email verification when email changes
    if (isEmailVerified || emailVerificationSent) {
      setIsEmailVerified(false);
      setEmailVerificationSent(false);
      setEmailVerificationOtp("");
      setEmailVerificationError("");
      clearEmailVerificationTimer();
      setEmailVerificationCountdown(0);
    }
  };

  const handleRoleChange = (value: string) => {
    const roleKey = value as RoleKey;
    setUserType(roleKey);
    setServiceId("");
    setServiceIdError("");
    setActivationPassword("");
    setActivationPasswordError("");
    setShowPassword(false);
    setEmailOtp("");
    setEmailOtpError("");
    clearOtpTimer();
    setOtpSent(false);
    setOtpCountdown(0);
    evaluateEmailAgainstRole(roleConfigurations[roleKey], undefined, roleKey);
    const enforcedMethod = roleConfigurations[roleKey]?.enforcedMfaMethod;
    setMfaMethod(enforcedMethod ?? "totp");
  };

  const handleServiceIdChange = (rawValue: string) => {
    const normalized = computeNormalizedId(rawValue, currentRoleConfig);
    setServiceId(normalized);
    if (serviceIdError) {
      setServiceIdError("");
    }
  };

  const handleMfaMethodChange = (value: string) => {
    if (currentRoleConfig?.enforcedMfaMethod) {
      setMfaMethod(currentRoleConfig.enforcedMfaMethod as "totp" | "email");
      return;
    }

    setMfaMethod(value === "email" ? "email" : "totp");
    if (value === "email") {
      setEmailOtp("");
      setEmailOtpError("");
      setOtpSent(false);
      setOtpCountdown(0);
    } else {
      setEmailOtp("");
      setEmailOtpError("");
      clearOtpTimer();
      setOtpSent(false);
      setOtpCountdown(0);
    }
  };

  const handleActivationPasswordChange = (value: string) => {
    setActivationPassword(value);
    if (activationPasswordError) {
      validateActivationPassword(value, currentRoleConfig);
    }
  };

  const handleEmailOtpChange = (rawValue: string) => {
    const cleaned = rawValue.replace(/\D/g, "").slice(0, 6);
    setEmailOtp(cleaned);
    if (emailOtpError) {
      setEmailOtpError("");
    }
  };

  const validateServiceId = (value: string, config: RoleConfig) => {
    if (!value) {
      const message = `Provide your ${config.idLabel}.`;
      setServiceIdError(message);
      return message;
    }

    if (!config.idPattern.test(value)) {
      setServiceIdError(config.idValidationMessage);
      return config.idValidationMessage;
    }

    if (config.inputType === "email") {
      if (config.emailWhitelist && !config.emailWhitelist.includes(value)) {
        const message = "Email not listed in the approved roster.";
        setServiceIdError(message);
        return message;
      }
      if (config.emailPattern && !config.emailPattern.test(value)) {
        const message = config.emailErrorMessage ?? config.idValidationMessage;
        setServiceIdError(message);
        return message;
      }
    }

    setServiceIdError("");
    return null;
  };

  const validateActivationPassword = (value: string, config?: RoleConfig) => {
    const candidate = value;

    if (!candidate.trim()) {
      const message = "Create a password that meets the listed policy.";
      setActivationPasswordError(message);
      return message;
    }

    if (!PASSWORD_POLICY_REGEX.test(candidate)) {
      setActivationPasswordError(baselinePasswordMessage);
      return baselinePasswordMessage;
    }

    const minLength = Math.max(12, config?.passwordPolicy?.minLength ?? minRequiredPasswordLength);
    if (candidate.length < minLength) {
      const message =
        config?.passwordPolicy?.message ??
        `Password must be at least ${minLength} characters and include uppercase letters, numbers, and special characters.`;
      setActivationPasswordError(message);
      return message;
    }

    if (config?.passwordPolicy?.requireSpecialCharacter && !/[^A-Za-z0-9]/.test(candidate)) {
      const message = config.passwordPolicy.message ?? "Include at least one special character in your password.";
      setActivationPasswordError(message);
      return message;
    }

    setActivationPasswordError("");
    return null;
  };

  useEffect(() => {
    if (currentRoleConfig?.enforcedMfaMethod && mfaMethod !== currentRoleConfig.enforcedMfaMethod) {
      setMfaMethod(currentRoleConfig.enforcedMfaMethod);
    }
  }, [currentRoleConfig?.enforcedMfaMethod, mfaMethod]);

  useEffect(() => {
    if (!showMFASetup || mfaMethod !== "email") {
      clearOtpTimer();
      setOtpSent(false);
      setOtpCountdown(0);
    }
  }, [showMFASetup, mfaMethod]);

  useEffect(() => () => clearOtpTimer(), []);

  // Cleanup email verification timer on unmount
  useEffect(() => () => clearEmailVerificationTimer(), []);

  const handleIdentityStep = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !email || !mobile) {
      toast({
        title: "Details Needed",
        description: "Provide your name, email, and mobile number.",
        variant: "destructive",
      });
      return;
    }

    if (mobile.length < 10 || mobile.length > 15) {
      toast({
        title: "Invalid Mobile Number",
        description: "Please enter a valid mobile number (10-15 digits).",
        variant: "destructive",
      });
      return;
    }

    if (!isEmailVerified) {
      toast({
        title: "Email Verification Required",
        description: "Please verify your email address before continuing.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Identity Confirmed",
      description: "Next, share your service credentials.",
    });
    setCurrentStep(2);
  };

  const handleServiceStep = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userType) {
      toast({
        title: "Select Your Role",
        description: "Choose your role to continue registration.",
        variant: "destructive",
      });
      return;
    }

    const config = roleConfigurations[userType];
    const normalizedId = computeNormalizedId(serviceId, config);
    setServiceId(normalizedId);

    const serviceIdMessage = validateServiceId(normalizedId, config);
    if (serviceIdMessage) {
      toast({
        title: "Check your credentials",
        description: serviceIdMessage,
        variant: "destructive",
      });
      return;
    }

    if (emailError) {
      toast({
        title: "Resolve Email Requirement",
        description: emailError,
        variant: "destructive",
      });
      return;
    }

    try {
      // Call registerService API (registration_challenge cookie auto-sent)
      const result = await registerService({
        role: userType,
        identifier: normalizedId,
      });

      if (result.success && result.data) {
        toast({
          title: "Service Details Saved",
          description: "Configure security preferences.",
        });
        setCurrentStep(3);
      } else {
        toast({
          title: "Service Verification Failed",
          description: result.error?.message || "Could not verify service credentials.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Service step error:", error);
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentRoleConfig) {
      toast({
        title: "Select Your Role",
        description: "Choose a role and complete earlier steps before submitting.",
        variant: "destructive",
      });
      return;
    }

    const passwordMessage = validateActivationPassword(activationPassword, currentRoleConfig);
    if (passwordMessage) {
      toast({
        title: "Update Password",
        description: passwordMessage,
        variant: "destructive",
      });
      return;
    }

    if (!agreedToTerms) {
      toast({
        title: "Accept Terms",
        description: "Confirm eligibility to proceed.",
        variant: "destructive",
      });
      return;
    }

    setIsVerified(false);
    setShowMFASetup(false);
    setIsSubmitted(true);
    setCurrentStep(4);

    try {
      // Call registerSecurity API (cookie auto-sent)
      const securityResult = await registerSecurity({
        mfa_method: mfaMethod === "totp" ? "TOTP" : "EMAIL",
        password: activationPassword,
        terms_accepted: agreedToTerms,
      });

      if (!securityResult.success || !securityResult.data) {
        setIsSubmitted(false);
        setCurrentStep(3);
        toast({
          title: "Security Setup Failed",
          description: securityResult.error?.message || "Could not save security settings.",
          variant: "destructive",
        });
        return;
      }

      setIsVerified(true);

      // Generate TOTP setup if TOTP method is selected
      if (mfaMethod === "totp") {
        const totpResult = await registerGenerateTotp();
        
        if (totpResult.success && totpResult.data) {
          // Server returns QR code and backup codes (using snake_case)
          setTotpSetup({
            qrCodeDataUrl: totpResult.data.qr_code || "",
            secret: totpResult.data.manual_entry_key || "",
            issuer: "Defence Incident Sentinel",
            accountName: email,
            uri: "", // Not used, but required by TotpSetup type
          } as unknown as TotpSetup);
          setBackupCodes(totpResult.data.backup_codes || []);
        } else {
          toast({
            title: "TOTP Setup Failed",
            description: totpResult.error?.message || "Failed to generate authenticator setup.",
            variant: "destructive",
          });
          return;
        }
      }
      
      toast({
        title: "Verification Successful",
        description: "Your Defence credentials have been verified.",
      });
      setShowMFASetup(true);
    } catch (error) {
      console.error("Security setup error:", error);
      setIsSubmitted(false);
      setCurrentStep(3);
      toast({
        title: "Error",
        description: "An error occurred during security setup. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCompleteMfaSetup = async () => {
    if (mfaMethod === "totp") {
      if (totpCode.length !== 6) {
        const message = "Enter the 6-digit code from your authenticator app.";
        setTotpError(message);
        toast({
          title: "Verify Authenticator Code",
          description: message,
          variant: "destructive",
        });
        return;
      }

      // Call registerActivateWithTotp API (server verifies TOTP code)
      try {
        const result = await registerActivateWithTotp({
          totp_verification_code: totpCode,
        });

        if (result.success && result.data) {
          setTotpCode("");
          setTotpError("");
          
          // Check for authorization code flow (new backend flow)
          if (result.data.redirect_url && result.data.code) {
            toast({
              title: "Registration Complete!",
              description: result.data.message || "Redirecting to dashboard...",
            });
            
            // Redirect to dashboard with authorization code
            setTimeout(() => {
              window.location.href = result.data.redirect_url!;
            }, 1500);
            return;
          }
          
          // Fallback: Old direct cookie flow (for backward compatibility)
          // Note: JWT tokens are set as HttpOnly cookies by the server
          // No need to store in localStorage
          
          toast({
            title: "Registration Complete!",
            description: result.data.message || "Redirecting to your dashboard...",
          });

          // Redirect to role-specific dashboard
          if (userType) {
            const redirectUrl = getRoleBasedRedirect(userType);
            setTimeout(() => {
              if (redirectUrl.startsWith("http")) {
                window.location.href = redirectUrl;
              } else {
                navigate(redirectUrl);
              }
            }, 1500);
          }
        } else {
          const message = result.error?.message || "Invalid code. Please try again.";
          setTotpError(message);
          toast({
            title: "Verification Failed",
            description: message,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("TOTP verification error:", error);
        toast({
          title: "Verification Error",
          description: "An error occurred. Please try again.",
          variant: "destructive",
        });
      }
      return;
    }

    if (mfaMethod === "email") {
      if (!otpSent) {
        const message = "Send the OTP to your email before completing setup.";
        setEmailOtpError(message);
        toast({
          title: "Send OTP",
          description: message,
          variant: "destructive",
        });
        return;
      }

      if (otpCountdown === 0) {
        const message = "Your OTP expired. Resend a new code to continue.";
        setEmailOtpError(message);
        toast({
          title: "OTP Expired",
          description: message,
          variant: "destructive",
        });
        return;
      }

      if (emailOtp.length !== 6) {
        const message = "Enter the 6-digit code we just sent to your email.";
        setEmailOtpError(message);
        toast({
          title: "Verify Email Code",
          description: message,
          variant: "destructive",
        });
        return;
      }

      // Call registerActivateWithEmailOtp API
      try {
        const result = await registerActivateWithEmailOtp(emailOtp);

        if (result.success && result.data) {
          clearOtpTimer();
          setEmailOtp("");
          setEmailOtpError("");
          setOtpSent(false);
          setOtpCountdown(0);
          
          // Check for authorization code flow (new backend flow)
          if (result.data.redirect_url && result.data.code) {
            toast({
              title: "Registration Complete!",
              description: result.data.message || "Redirecting to dashboard...",
            });
            
            // Redirect to dashboard with authorization code
            setTimeout(() => {
              window.location.href = result.data.redirect_url!;
            }, 1500);
            return;
          }
          
          // Fallback: Old direct cookie flow (for backward compatibility)
          // Note: JWT tokens are set as HttpOnly cookies by the server
          // No need to store in localStorage
          
          toast({
            title: "Registration Complete!",
            description: result.data.message || "Redirecting to your dashboard...",
          });

          // Redirect to role-specific dashboard
          if (userType) {
            const redirectUrl = getRoleBasedRedirect(userType);
            setTimeout(() => {
              if (redirectUrl.startsWith("http")) {
                window.location.href = redirectUrl;
              } else {
                navigate(redirectUrl);
              }
            }, 1500);
          }
        } else {
          setEmailOtpError(result.error?.message || "Invalid code. Please try again.");
          toast({
            title: "Verification Failed",
            description: result.error?.message || "Invalid verification code.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Email OTP verification error:", error);
        toast({
          title: "Verification Error",
          description: "An error occurred. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleBackFromMfa = () => {
    clearOtpTimer();
    setEmailOtp("");
    setEmailOtpError("");
    setOtpSent(false);
    setOtpCountdown(0);
    setShowMFASetup(false);
    setIsSubmitted(false);
    setCurrentStep(3);
  };

  if (isSubmitted && !isVerified && !emailError) {
    return (
      <div className="space-y-6 text-center py-8">
        <div className="flex justify-center">
          <div className="w-16 h-16 border-4 border-[hsl(213,100%,18%)] border-t-transparent rounded-full animate-spin" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[hsl(213,100%,18%)]">Verification in Progress</h2>
          <p className="text-sm text-[hsl(0,0%,31%)] mt-2">
            Validating your credentials with Defence systems...
          </p>
        </div>
      </div>
    );
  }

  if (isSubmitted && !isVerified && emailError) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[hsl(213,100%,18%)]">Manual Review Required</h2>
          <p className="text-sm text-[hsl(0,0%,31%)] mt-2">Your registration is pending verification</p>
        </div>

        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Your registration has been submitted for manual review. You'll receive an email notification once your account is verified by an administrator.
          </AlertDescription>
        </Alert>

        <div className="bg-[hsl(210,40%,96.1%)] p-4 rounded-lg space-y-2">
          <h3 className="font-semibold text-sm">What happens next?</h3>
          <ul className="text-sm space-y-1 text-[hsl(0,0%,31%)]">
            <li>• Admin team will verify your credentials</li>
            <li>• Review typically takes 24-48 hours</li>
            <li>• You'll receive email notification</li>
            <li>• Once approved, you can set up MFA and login</li>
          </ul>
        </div>

        <Button variant="outline" className="w-full" onClick={() => {
          setIsSubmitted(false);
          setIsVerified(false);
          setShowMFASetup(false);
          setCurrentStep(1);
        }}>
          Submit Another Registration
        </Button>
      </div>
    );
  }


  return (
    <TooltipProvider>
  <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-[hsl(213,100%,18%)]">Register for Access</h2>
          <p className="text-sm text-[hsl(0,0%,31%)] mt-2">Follow the guided onboarding steps</p>
        </div>

        <div className="flex items-center gap-3">
          {steps.map((step) => {
            const isActive = currentStep === step.id;
            const isComplete = currentStep > step.id;

            return (
              <div key={step.id} className="flex flex-1 items-center gap-3">
                <div
                  className={cn(
                    "step-node w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold",
                    isComplete || isActive
                      ? "bg-gradient-to-br from-[hsl(207,90%,54%)] to-[hsl(213,100%,18%)] text-white"
                      : "bg-[hsl(213,100%,18%)]/10 text-[hsl(213,100%,18%)]",
                    isActive && "step-node--active",
                    isComplete && "step-node--complete"
                  )}
                >
                  {step.id}
                </div>
                <div
                  className={cn(
                    "hidden md:block transition-all duration-300",
                    isActive ? "opacity-100 translate-y-0" : isComplete ? "opacity-80 translate-y-[1px]" : "opacity-60 translate-y-[2px]"
                  )}
                >
                  <p className="text-xs font-semibold text-[hsl(213,100%,18%)]">{step.title}</p>
                  <p className="text-[10px] text-[hsl(0,0%,31%)]">{step.description}</p>
                </div>
                {step.id !== steps.length && (
                  <div className="flex-1">
                    <div className={cn("step-line", isComplete && "step-line--complete")}>
                      <span
                        className={cn(
                          "step-line__progress",
                          isComplete && "step-line__progress--filled",
                          isActive && !isComplete && "step-line__progress--active"
                        )}
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {currentStep === 1 && (
        <form onSubmit={handleIdentityStep} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number *</Label>
              <Input
                id="mobile"
                type="tel"
                placeholder="+91 XXXXXXXXXX"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="yourname@gov.in"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              disabled={isEmailVerified}
            />
            {emailError ? (
              <p className="text-xs text-[hsl(0,84%,60%)]">{emailError}</p>
            ) : emailWarning ? (
              <p className="text-xs text-[hsl(25,95%,60%)]">{emailWarning}</p>
            ) : isEmailVerified ? (
              <p className="text-xs text-[hsl(122,39%,49%)] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Email verified successfully
              </p>
            ) : email ? (
              <p className="text-xs text-[hsl(0,0%,45%)]">
                You'll need to verify this email before continuing.
              </p>
            ) : null}
          </div>

          {/* Email Verification Section */}
          {email && !isEmailVerified && (
            <div className="space-y-3 p-4 bg-[hsl(210,40%,96.1%)] rounded-lg border border-[hsl(213,100%,18%)]/10">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-[hsl(213,100%,18%)]">Verify Your Email</Label>
                {emailVerificationSent && emailVerificationCountdown > 0 && (
                  <span className="text-xs text-[hsl(122,39%,49%)]">
                    Code expires in {formatCountdown(emailVerificationCountdown)}
                  </span>
                )}
              </div>
              
              {!emailVerificationSent ? (
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={handleSendEmailVerification}
                  className="w-full"
                >
                  Send Verification Code
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="emailVerificationOtp">Enter 6-Digit Code</Label>
                    <Input
                      id="emailVerificationOtp"
                      type="text"
                      inputMode="numeric"
                      pattern="\d*"
                      placeholder="000000"
                      maxLength={6}
                      value={emailVerificationOtp}
                      onChange={(e) => handleEmailVerificationOtpChange(e.target.value)}
                      className="text-center text-2xl tracking-widest"
                      aria-invalid={Boolean(emailVerificationError)}
                    />
                    {emailVerificationError && (
                      <p className="text-xs text-[hsl(0,84%,60%)]">{emailVerificationError}</p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleSendEmailVerification}
                      disabled={emailVerificationCountdown > 0}
                      className="flex-1"
                    >
                      {emailVerificationCountdown > 0 
                        ? `Resend in ${formatCountdown(emailVerificationCountdown)}` 
                        : "Resend Code"}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleVerifyEmail}
                      disabled={emailVerificationOtp.length !== 6}
                      className="flex-1"
                    >
                      Verify Email
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Verified Email Confirmation */}
          {isEmailVerified && (
            <Alert className="bg-[hsl(122,39%,49%)]/10 border-[hsl(122,39%,49%)]/20">
              <CheckCircle2 className="h-4 w-4 text-[hsl(122,39%,49%)]" />
              <AlertDescription className="text-[hsl(122,39%,49%)]">
                Your email has been verified. You can now continue to the next step.
              </AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={!isEmailVerified}
          >
            Continue to Service Details
          </Button>
        </form>
      )}

      {currentStep === 2 && (
        <form onSubmit={handleServiceStep} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="userType">Select Your Role *</Label>
              <Select value={userType} onValueChange={handleRoleChange}>
                <SelectTrigger id="userType">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="serviceId">
                  {(currentRoleConfig?.idLabel ?? "Credential ID")} *
                </Label>
                {currentRoleConfig && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="text-[hsl(213,100%,18%)]/70 hover:text-[hsl(213,100%,18%)] focus:outline-none"
                        aria-label="Role credential guidance"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs leading-relaxed">
                      {currentRoleConfig.tooltip}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <Input
                id="serviceId"
                type={currentRoleConfig?.inputType ?? "text"}
                placeholder={currentRoleConfig?.placeholder ?? "Enter credential"}
                value={serviceId}
                onChange={(e) => handleServiceIdChange(e.target.value)}
                autoComplete="off"
                aria-invalid={Boolean(serviceIdError)}
              />
              {serviceIdError ? (
                <p className="text-xs text-[hsl(0,84%,60%)]">{serviceIdError}</p>
              ) : currentRoleConfig ? (
                <p className="text-xs text-[hsl(0,0%,45%)]">{currentRoleConfig.tooltip}</p>
              ) : null}
            </div>
          </div>

          {roleSecurityMessages.length > 0 && (
            <Collapsible>
              <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-lg border border-[hsl(213,100%,18%)]/10 bg-[hsl(210,40%,96.1%)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[hsl(213,100%,18%)] transition hover:bg-[hsl(210,40%,94%)]">
                <span>Role security notes</span>
                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" aria-hidden="true" />
              </CollapsibleTrigger>
              <CollapsibleContent className="border-x border-b border-[hsl(213,100%,18%)]/10 bg-[hsl(210,40%,96.1%)] px-4 py-3 text-xs text-[hsl(0,0%,31%)]">
                <ul className="space-y-1 list-disc list-inside">
                  {roleSecurityMessages.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </CollapsibleContent>
            </Collapsible>
          )}

          <Collapsible>
            <CollapsibleTrigger className="text-sm text-[hsl(207,90%,54%)] hover:underline">
              What proofs we accept?
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="bg-[hsl(210,40%,96.1%)] p-4 rounded-lg text-sm space-y-2">
                <p className="font-semibold">Accepted Identification Documents:</p>
                <div className="grid gap-2 text-[hsl(0,0%,31%)] sm:grid-cols-2">
                  <p>• SPARSH ID (Service Personnel)</p>
                  <p>• Defence Force ID (D-FID)</p>
                  <p>• Service Number</p>
                  <p>• Pension Payment Order (PPO)</p>
                  <p>• ECHS Card Number</p>
                  <p>• Dependent ID Card</p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>
              Back
            </Button>
            <Button type="submit" className="w-full" size="lg">
              Continue to Security Preferences
            </Button>
          </div>
        </form>
      )}

      {currentStep === 3 && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>Preferred MFA Method *</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3" role="radiogroup" aria-label="Select MFA method">
              <button
                type="button"
                onClick={() => handleMfaMethodChange("totp")}
                className={`rounded-lg border p-4 text-left transition shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[hsl(213,100%,18%)] ${
                  mfaMethod === "totp"
                    ? "border-[hsl(213,100%,18%)] bg-[hsl(210,40%,96.1%)]"
                    : "border-[hsl(213,100%,18%)]/20 bg-white"
                }`}
                role="radio"
                aria-checked={mfaMethod === "totp"}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      mfaMethod === "totp"
                        ? "bg-[hsl(213,100%,18%)] text-white"
                        : "bg-[hsl(213,100%,18%)]/10 text-[hsl(213,100%,18%)]"
                    }`}
                  >
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-[hsl(213,100%,18%)]">Authenticator App</p>
                    <p className="text-xs text-[hsl(0,0%,45%)]">Use time-based codes from your authenticator.</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleMfaMethodChange("email")}
                className={`rounded-lg border p-4 text-left transition shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[hsl(213,100%,18%)] ${
                  mfaMethod === "email"
                    ? "border-[hsl(213,100%,18%)] bg-[hsl(210,40%,96.1%)]"
                    : "border-[hsl(213,100%,18%)]/20 bg-white"
                } ${currentRoleConfig?.enforcedMfaMethod === "totp" ? "opacity-60 cursor-not-allowed" : "hover:shadow-md"}`}
                role="radio"
                aria-checked={mfaMethod === "email"}
                aria-disabled={currentRoleConfig?.enforcedMfaMethod === "totp"}
                disabled={currentRoleConfig?.enforcedMfaMethod === "totp"}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      mfaMethod === "email"
                        ? "bg-[hsl(213,100%,18%)] text-white"
                        : "bg-[hsl(213,100%,18%)]/10 text-[hsl(213,100%,18%)]"
                    }`}
                  >
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-[hsl(213,100%,18%)]">Email OTP</p>
                    <p className="text-xs text-[hsl(0,0%,30%)]">Receive one-time codes via your registered email.</p>
                  </div>
                </div>
              </button>
            </div>
            <p className="text-xs text-[hsl(0,0%,31%)]">
              {currentRoleConfig?.enforcedMfaMethod === "totp"
                ? "Authenticator-based MFA is enforced for this role."
                : "TOTP offers higher security and works offline"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="activationPassword">Create Portal Password *</Label>
            <div className="relative">
              <Input
                id="activationPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Create a secure password"
                value={activationPassword}
                onChange={(e) => handleActivationPasswordChange(e.target.value)}
                autoComplete="new-password"
                aria-invalid={Boolean(activationPasswordError)}
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 flex items-center text-[hsl(213,100%,18%)]/70 hover:text-[hsl(213,100%,18%)]"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {activationPasswordError ? (
              <p className="text-xs text-[hsl(0,84%,60%)]">{activationPasswordError}</p>
            ) : (
              <Collapsible>
                <div className="flex items-center gap-2 text-xs text-[hsl(0,0%,31%)]">
                  <span>Must satisfy the requirements below.</span>
                  <CollapsibleTrigger className="text-[hsl(207,90%,54%)] hover:underline">
                    View policy
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent className="mt-2">
                  <div className="bg-[hsl(210,40%,96.1%)] border border-[hsl(213,100%,18%)]/15 rounded-lg p-4 space-y-2">
                    <p className="text-sm font-semibold text-[hsl(213,100%,18%)]">Password policy</p>
                    <p className="text-xs text-[hsl(0,0%,31%)]">
                      You will create your portal password during activation. Prepare one that complies with:
                    </p>
                    <ul className="text-xs text-[hsl(0,0%,31%)] list-disc list-inside space-y-1">
                      {passwordPolicyMessages.map((policy) => (
                        <li key={policy}>{policy}</li>
                      ))}
                    </ul>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
          <div className="flex items-start gap-2 py-2">
            <input
              type="checkbox"
              id="terms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 rounded"
            />
            <Label htmlFor="terms" className="text-sm font-normal cursor-pointer">
              I confirm I am a verified Defence personnel / family member / veteran and understand access restrictions *
            </Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button type="button" variant="outline" onClick={() => setCurrentStep(2)}>
              Back
            </Button>
            <Button type="submit" className="w-full" size="lg">
              Submit for Verification
            </Button>
          </div>
        </form>
      )}

      {currentStep === 4 && showMFASetup && (
        <div className="space-y-6">
          {mfaMethod === "totp" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Manual Entry Key</Label>
                <Input 
                  value={totpSetup?.manualEntryKey || "Loading..."} 
                  readOnly 
                  className="font-mono text-center" 
                />
                <p className="text-xs text-[hsl(0,0%,31%)]">Use this if you can't scan the QR code from the badge.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="totpCode">Enter Authenticator Code</Label>
                <Input
                  id="totpCode"
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  placeholder="000000"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    setTotpCode(value);
                    if (totpError) setTotpError("");
                  }}
                  className="text-center text-2xl tracking-widest"
                  aria-invalid={Boolean(totpError)}
                />
                {totpError ? (
                  <p className="text-xs text-[hsl(0,84%,60%)]">{totpError}</p>
                ) : (
                  <p className="text-xs text-[hsl(0,0%,24%)]">Enter the 6-digit code from your authenticator app.</p>
                )}
              </div>

              <div className="bg-[hsl(25,95%,60%)]/10 border border-[hsl(25,95%,60%)]/20 p-4 rounded-lg space-y-2">
                <h4 className="font-semibold text-sm">Backup Codes</h4>
                <p className="text-xs text-[hsl(0,0%,31%)]">
                  Save these codes securely. Each can be used once if you lose access to your authenticator.
                </p>
                <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-sm">
                  {backupCodes.slice(0, 10).map((code, index) => (
                    <code key={index} className="bg-white p-2 rounded">{code}</code>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-[hsl(0,0%,24%)]">You'll receive an email with a one-time code for MFA.</p>
              <div className="space-y-2">
                <Label htmlFor="emailOtpSetup">Enter Verification Code</Label>
                <Input
                  id="emailOtpSetup"
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={6}
                  value={emailOtp}
                  onChange={(e) => handleEmailOtpChange(e.target.value)}
                  className="text-center text-2xl tracking-widest"
                  aria-invalid={Boolean(emailOtpError)}
                />
                {emailOtpError ? (
                  <p className="text-xs text-[hsl(0,84%,60%)]">{emailOtpError}</p>
                ) : (
                  <p className="text-xs text-[hsl(0,0%,24%)]">Enter the OTP to confirm your email address.</p>
                )}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Button type="button" variant="secondary" onClick={handleSendOtp} disabled={otpCountdown > 0}>
                    {otpSent ? (otpCountdown > 0 ? `Resend in ${formatCountdown(otpCountdown)}` : "Resend OTP") : "Send OTP"}
                  </Button>
                  {otpSent && (
                    <p className={`text-xs ${otpCountdown > 0 ? "text-[hsl(122,39%,49%)]" : "text-[hsl(0,84%,60%)]"}`}>
                      {otpCountdown > 0
                        ? `OTP sent to ${email}. Valid for ${formatCountdown(otpCountdown)}.`
                        : "OTP expired. Tap resend to request a new code."}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <Button className="w-full" size="lg" onClick={handleCompleteMfaSetup}>
            Complete Setup & Continue
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={handleBackFromMfa}>
            Return to Security Settings
          </Button>
        </div>
      )}

      {currentStep <= 2 && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription className="text-xs">
            All registrations are verified. False information may result in legal action.
          </AlertDescription>
        </Alert>
      )}
      </div>
    </TooltipProvider>
  );
};

export default RegisterForm;
