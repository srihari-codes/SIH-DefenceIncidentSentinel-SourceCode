import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, Shield, Smartphone, AlertTriangle, Info, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { roleConfigurations, roleOptions, RoleConfig, RoleKey } from "@/lib/roleConfig";
import { cn } from "@/lib/utils";
import {
  loginIdentity,
  loginPassword,
  loginMfa,
  loginSendEmailOtp,
} from "@/services/authService";
import "./auth-stepper.css";

const BASE_PASSWORD_POLICY = "Minimum 12 characters, at least one uppercase letter, one number, and one special character.";
const PASSWORD_POLICY_REGEX = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{12,}$/;

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

const formatCountdown = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const LoginForm = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [mfaMethod, setMfaMethod] = useState<"totp" | "email">("totp");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(60);
  const [showSSOModal, setShowSSOModal] = useState(false);
  const [showVPNModal, setShowVPNModal] = useState(false);
  const [showNCRPModal, setShowNCRPModal] = useState(false);
  const [userType, setUserType] = useState<RoleKey | "">("");
  const [serviceId, setServiceId] = useState("");
  const [serviceIdError, setServiceIdError] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const otpTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast } = useToast();

  const currentRoleConfig = userType ? roleConfigurations[userType] : undefined;

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

  const handleRoleChange = (value: string) => {
    const roleKey = value as RoleKey;
    setUserType(roleKey);
    setServiceId("");
    setServiceIdError("");
    setEmail("");
    setEmailError("");
    setPasswordError("");
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

  const handleEmailChange = (rawValue: string) => {
    setEmail(rawValue);
    if (emailError) {
      setEmailError("");
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (passwordError) {
      setPasswordError("");
    }
  };

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
    setIsSubmitting(true);
    try {
      // Call the login/mfa API with send_otp action
      const result = await loginSendEmailOtp();

      if (result.success && result.data) {
        setEmailError("");
        setOtpSent(true);
        setOtpCode("");
        // Use server's expiresIn or default to 300 seconds (5 min)
        const expiresIn = result.data.expiresIn || 300;
        setOtpCountdown(expiresIn);
        startOtpCountdown();
        toast({
          title: "OTP Sent",
          description: result.data.message || "A one-time code has been sent to your email.",
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMfaMethodChange = (value: string) => {
    // LENIENT MODE: Allow manual switching even if enforced
    // if (currentRoleConfig?.enforcedMfaMethod) {
    //   setMfaMethod(currentRoleConfig.enforcedMfaMethod as "totp" | "email");
    //   return;
    // }

    setMfaMethod(value === "email" ? "email" : "totp");
    if (value === "email") {
      clearOtpTimer();
      setOtpSent(false);
      setOtpCountdown(0);
      setOtpCode("");
    } else {
      clearOtpTimer();
      setOtpSent(false);
      setOtpCountdown(0);
      setOtpCode("");
    }
  };

  const validateServiceId = (value: string, config: RoleConfig) => {
    // LENIENT MODE FOR PRESENTATION: Accept any non-empty identifier
    if (!value || value.trim().length === 0) {
      setServiceIdError(`${config.idLabel} is required`);
      return false;
    }

    setServiceIdError("");
    return true;

    // ORIGINAL STRICT VALIDATION (commented out for presentation)
    // if (!config.idPattern.test(value)) {
    //   setServiceIdError(config.idValidationMessage);
    //   return false;
    // }
  };

  const validateEmailForRole = (value: string, config: RoleConfig): string | null => {
    const candidate = value.trim().toLowerCase();

    // LENIENT MODE FOR PRESENTATION: Only check basic email format
    if (!candidate) {
      const message = "Email is required.";
      setEmailError(message);
      return message;
    }

    // Basic email format check
    const basicEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!basicEmailPattern.test(candidate)) {
      const message = "Please enter a valid email address.";
      setEmailError(message);
      return message;
    }

    setEmailError("");
    return null;

    // ORIGINAL STRICT VALIDATION (commented out for presentation)
    // if (config.emailWhitelist && !config.emailWhitelist.includes(candidate)) {
    //   const message = "Email not listed in the approved roster.";
    //   setEmailError(message);
    //   return message;
    // }
    //
    // if (config.emailPattern && !config.emailPattern.test(candidate)) {
    //   const message = config.emailErrorMessage ?? "Please use the required official email domain.";
    //   setEmailError(message);
    //   return message;
    // }
  };

  const steps = [
    {
      id: 1,
      title: "Unit Credentials",
      description: "Identify yourself"
    },
    {
      id: 2,
      title: "Security Check",
      description: "Password & network"
    },
    {
      id: 3,
      title: "MFA",
      description: "Authenticate"
    }
  ];

  useEffect(() => {
    // LENIENT MODE: Don't auto-switch to enforced method
    // if (currentRoleConfig?.enforcedMfaMethod && currentRoleConfig.enforcedMfaMethod !== mfaMethod) {
    //   setMfaMethod(currentRoleConfig.enforcedMfaMethod);
    // }
  }, [currentRoleConfig?.enforcedMfaMethod, mfaMethod]);

  useEffect(() => {
    if (mfaMethod !== "email") {
      clearOtpTimer();
      setOtpSent(false);
      setOtpCountdown(0);
    }
  }, [mfaMethod]);

  useEffect(() => {
    return () => clearOtpTimer();
  }, []);

  const roleSecurityMessages = currentRoleConfig
    ? [
        ...(currentRoleConfig.securityNotes ?? []),
        ...(currentRoleConfig.highPrivilege ? ["High-privilege monitoring enabled."] : []),
        ...(currentRoleConfig.readOnlyRole ? ["Access limited to read-only mode after login."] : []),
      ]
    : [];

  const requiresEmailEntry = Boolean(
    currentRoleConfig?.requiresDefenceEmail || currentRoleConfig?.inputType === "email"
  );
  const showServiceIdField = currentRoleConfig?.inputType !== "email";
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

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userType) {
      toast({
        title: "Select Your Role",
        description: "Choose your role to continue the login process.",
        variant: "destructive",
      });
      return;
    }

    const config = roleConfigurations[userType];

    if (showServiceIdField) {
      const normalizedId = computeNormalizedId(serviceId, config);
      setServiceId(normalizedId);

      if (!normalizedId) {
        const message = `Provide your ${config.idLabel} to proceed.`;
        setServiceIdError(message);
        toast({
          title: "Credential Required",
          description: message,
          variant: "destructive",
        });
        return;
      }

      if (!validateServiceId(normalizedId, config)) {
        toast({
          title: "Check your credentials",
          description: config.idValidationMessage,
          variant: "destructive",
        });
        return;
      }
    }

    if (requiresEmailEntry) {
      const normalizedEmail = email.trim().toLowerCase();
      setEmail(normalizedEmail);
      const emailMessage = validateEmailForRole(normalizedEmail, config);

      if (emailMessage) {
        toast({
          title: "Resolve Email Requirement",
          description: emailMessage,
          variant: "destructive",
        });
        return;
      }
    }

    // Step 1: Call login/identity API
    setIsSubmitting(true);
    try {
      const identifier = showServiceIdField ? serviceId : email;
      const normalizedEmail = email.trim().toLowerCase() || identifier;
      
      const result = await loginIdentity({
        role: userType,
        identifier,
        email: normalizedEmail,
      });

      if (result.success && result.data) {
        toast({
          title: "Identity Verified",
          description: result.data.message || "Proceed to password verification.",
        });
        setCurrentStep(2);
      } else {
        const newFailedAttempts = failedAttempts + 1;
        setFailedAttempts(newFailedAttempts);
        
        if (newFailedAttempts >= 3) {
          setIsLocked(true);
          toast({
            title: "Account Locked",
            description: "Too many failed attempts. Your account is locked for 60 minutes.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Identity Verification Failed",
            description: result.error?.message || `Invalid credentials. ${3 - newFailedAttempts} attempts remaining.`,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Identity verification error:", error);
      toast({
        title: "Verification Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password) {
      toast({
        title: "Password Required",
        description: "Please enter your password.",
        variant: "destructive",
      });
      return;
    }

    if (!PASSWORD_POLICY_REGEX.test(password)) {
      setPasswordError(baselinePasswordMessage);
      toast({
        title: "Password Policy Enforcement",
        description: baselinePasswordMessage,
        variant: "destructive",
      });
      return;
    }

    const config = userType ? roleConfigurations[userType] : undefined;
    if (config?.passwordPolicy) {
      const { minLength, requireSpecialCharacter, message } = config.passwordPolicy;
      const specialCharacterRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
      if (
        password.length < minLength ||
        (requireSpecialCharacter && !specialCharacterRegex.test(password))
      ) {
        setPasswordError(message);
        toast({
          title: "Password Policy Enforcement",
          description: message,
          variant: "destructive",
        });
        return;
      }
    }

    setPasswordError("");
    setIsSubmitting(true);

    try {
      // Step 2: Call login/password API (cookie auto-sent)
      const result = await loginPassword({ password });

      if (result.success && result.data) {
        // Set MFA method based on server response
        if (result.data.allowedMethods?.length > 0) {
          const serverMethod = result.data.allowedMethods[0];
          setMfaMethod(serverMethod === "TOTP" ? "totp" : "email");
        }

        setCurrentStep(3);
        clearOtpTimer();
        setOtpSent(false);
        setOtpCountdown(0);
        setOtpCode("");
        toast({
          title: "Password Verified",
          description: "Please complete MFA authentication.",
        });
      } else {
        const newFailedAttempts = failedAttempts + 1;
        setFailedAttempts(newFailedAttempts);
        
        if (newFailedAttempts >= 3) {
          setIsLocked(true);
          toast({
            title: "Account Locked",
            description: "Too many failed attempts. Your account is locked for 60 minutes.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Password Verification Failed",
            description: result.error?.message || `Invalid password. ${3 - newFailedAttempts} attempts remaining.`,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Password verification error:", error);
      toast({
        title: "Login Error",
        description: "An error occurred during login. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMFAVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mfaMethod === "email") {
      if (!otpSent) {
        toast({
          title: "Send OTP",
          description: "Tap 'Send OTP' before entering the verification code.",
          variant: "destructive",
        });
        return;
      }

      if (otpCountdown === 0) {
        toast({
          title: "OTP Expired",
          description: "Your one-time code has expired. Request a new OTP.",
          variant: "destructive",
        });
        return;
      }
    }

    if (otpCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid 6-digit code.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 3: Call login/mfa API (cookie auto-sent)
      const result = await loginMfa({
        method: mfaMethod === "totp" ? "TOTP" : "EMAIL",
        code: otpCode,
      });

      if (result.success && result.data) {
        clearOtpTimer();
        setOtpCountdown(0);
        setOtpSent(false);
        
        // Check for authorization code flow (new backend flow)
        if (result.data.redirect_url && result.data.code) {
          toast({
            title: "Authentication Successful",
            description: "Redirecting to dashboard...",
          });
          
          // Redirect to dashboard with authorization code
          setTimeout(() => {
            window.location.href = result.data.redirect_url!;
          }, 1000);
          return;
        }
        
        // Fallback: Old direct cookie flow (for backward compatibility)
        if (result.data.user) {
          // Note: JWT tokens are now set as HttpOnly cookies by the server
          // No need to store in localStorage
          
          toast({
            title: "Authentication Successful",
            description: "Redirecting to dashboard...",
          });
          
          // Navigate to role-specific dashboard
          const redirectUrl = getRoleBasedRedirect(userType as RoleKey);
          setTimeout(() => {
            if (redirectUrl.startsWith("http")) {
              window.location.href = redirectUrl;
            } else {
              navigate(redirectUrl);
            }
          }, 1000);
        }
      } else {
        toast({
          title: "Verification Failed",
          description: result.error?.message || "Invalid verification code.",
          variant: "destructive",
        });
        setOtpCode("");
      }
    } catch (error) {
      console.error("MFA verification error:", error);
      toast({
        title: "Verification Error",
        description: "An error occurred during verification. Please try again.",
        variant: "destructive",
      });
      setOtpCode("");
    } finally {
      setIsSubmitting(false);
    }
  };

  let pageContent: JSX.Element;

  if (isLocked) {
    pageContent = (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[hsl(213,100%,18%)]">Account Locked</h2>
          <p className="text-sm text-[hsl(0,0%,31%)] mt-2">Security measure activated</p>
        </div>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Too many failed attempts. Your account is temporarily locked for {lockoutTime} minutes. Contact Admin or wait for the lockout period to expire.
          </AlertDescription>
        </Alert>

        <div className="text-center py-8">
          <div className="text-6xl font-bold text-[hsl(213,100%,18%)] mb-2">
            {lockoutTime}:00
          </div>
          <p className="text-sm text-[hsl(0,0%,31%)]">Time remaining</p>
        </div>

        <Button disabled className="w-full" size="lg">
          Request Unlock (Disabled)
        </Button>

        <div className="text-center">
          <Button variant="link" onClick={() => setShowNCRPModal(true)}>
            Unauthorized? Visit NCRP
          </Button>
        </div>
      </div>
    );
  } else if (currentStep === 3) {
    pageContent = (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[hsl(213,100%,18%)]">Multi-Factor Authentication</h2>
          <p className="text-sm text-[hsl(0,0%,31%)] mt-2">Secure your access with MFA</p>
        </div>

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Choose your preferred authentication method
          </AlertDescription>
        </Alert>

        <form onSubmit={handleMFAVerify} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mfa-option">MFA Method</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3" role="radiogroup" id="mfa-option">
              <button
                type="button"
                onClick={() => handleMfaMethodChange("totp")}
                className={`rounded-lg border p-4 text-left transition shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[hsl(213,100%,18%)] ${
                  mfaMethod === "totp"
                    ? "border-[hsl(213,100%,18%)] bg-[hsl(210,40%,96.1%)]"
                    : "border-[hsl(213,100%,18%)]/20 bg-white"
                }`}
                role="radio"
                aria-checked={mfaMethod === "totp"}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    mfaMethod === "totp"
                      ? "bg-[hsl(213,100%,18%)] text-white"
                      : "bg-[hsl(213,100%,18%)]/10 text-[hsl(213,100%,18%)]"
                  }`}>
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-[hsl(213,100%,18%)]">Authenticator App</p>
                    <p className="text-xs text-[hsl(0,0%,45%)]">
                      Use TOTP codes from your registered authenticator.
                    </p>
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
                // LENIENT MODE: Commented out disabled logic to allow Email OTP for everyone
                // aria-disabled={currentRoleConfig?.enforcedMfaMethod === "totp"}
                // disabled={currentRoleConfig?.enforcedMfaMethod === "totp"}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    mfaMethod === "email"
                      ? "bg-[hsl(213,100%,18%)] text-white"
                      : "bg-[hsl(213,100%,18%)]/10 text-[hsl(213,100%,18%)]"
                  }`}>
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-[hsl(213,100%,18%)]">Email OTP</p>
                    <p className="text-xs text-[hsl(0,0%,30%)]">Receive one-time codes via email.</p>
                  </div>
                </div>
              </button>
            </div>
            {currentRoleConfig?.enforcedMfaMethod === "totp" && (
              <p className="text-xs text-[hsl(0,0%,45%)]">
                Authenticator-based MFA is enforced for this role.
              </p>
            )}
          </div>

          {mfaMethod === "email" && (
            <div className="space-y-2">
              <Label htmlFor="emailOtp">Enter OTP Code</Label>
              <Input
                id="emailOtp"
                type="text"
                inputMode="numeric"
                pattern="\d*"
                placeholder="000000"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              />
              <p className="text-xs text-[hsl(0,0%,24%)]">Check your email for the 6-digit code.</p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleSendOtp}
                  disabled={otpCountdown > 0}
                >
                  {otpSent
                    ? otpCountdown > 0
                      ? `Resend in ${formatCountdown(otpCountdown)}`
                      : "Resend OTP"
                    : "Send OTP"}
                </Button>
                {otpSent && (
                  <p
                    className={`text-xs ${
                      otpCountdown > 0
                        ? "text-[hsl(122,39%,49%)]"
                        : "text-[hsl(0,84%,60%)]"
                    }`}
                  >
                    {otpCountdown > 0
                      ? `OTP sent to ${email}. Valid for ${formatCountdown(otpCountdown)}.`
                      : "OTP expired. Tap resend to get a fresh code."}
                  </p>
                )}
              </div>
            </div>
          )}

          {mfaMethod === "totp" && (
            <div className="space-y-2">
              <Label htmlFor="otp">Authenticator Code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit code"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                className="text-center text-2xl tracking-widest"
              />
              <p className="text-xs text-[hsl(0,0%,24%)]">
                Enter the code from your authenticator app
              </p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input type="checkbox" id="remember" className="rounded" />
            <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
              Remember this device for 1 week
            </Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setCurrentStep(2)}>
              Back
            </Button>
            <Button type="submit" className="w-full" size="lg">
              Verify & Login
            </Button>
          </div>

          <div className="text-center">
            <Button variant="link" size="sm">
              Use backup code
            </Button>
          </div>
        </form>
      </div>
    );
  } else {
    pageContent = (
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-[hsl(213,100%,18%)]">Sign in to Defence Incident Sentinell</h2>
            <p className="text-sm text-[hsl(0,0%,31%)] mt-2">Complete the secure login steps</p>
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
                      isActive
                        ? "opacity-100 translate-y-0"
                        : isComplete
                          ? "opacity-80 translate-y-[1px]"
                          : "opacity-60 translate-y-[2px]"
                    )}
                  >
                    <p className="text-xs font-semibold text-[hsl(213,100%,18%)]">{step.title}</p>
                    <p className="text-[10px] text-[hsl(0,0%,31%)]">{step.description}</p>
                  </div>
                  {step.id !== steps.length && (
                    <div className="flex-1">
                      <div className={cn("step-line", isComplete && "step-line--complete") }>
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

        {failedAttempts > 0 && failedAttempts < 3 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {failedAttempts} failed attempt(s). {3 - failedAttempts} remaining before lockout.
            </AlertDescription>
          </Alert>
        )}

        {currentStep === 1 && (
          <form onSubmit={handleCredentialsSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              <div className="space-y-2 md:col-span-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor="userType" className="flex-1">Select Your Role *</Label>
                  <span className="inline-flex w-4 h-4" aria-hidden="true" />
                </div>
                <Select value={userType} onValueChange={handleRoleChange}>
                  <SelectTrigger id="userType">
                    <SelectValue placeholder="Select Your Role" />
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

              {showServiceIdField && (
                <div
                  className={`space-y-2 ${
                    requiresEmailEntry ? "md:col-span-1" : "md:col-span-2"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Label htmlFor="serviceId" className="flex-1">
                      {(currentRoleConfig?.idLabel ?? "Credential ID")} *
                    </Label>
                    {currentRoleConfig && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="text-[hsl(213,100%,18%)]/70 hover:text-[hsl(213,100%,18%)] focus:outline-none inline-flex h-5 w-5 items-center justify-center"
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
                    type="text"
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
              )}

              {requiresEmailEntry && (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="officialEmail">
                    {currentRoleConfig?.inputType === "email"
                      ? `${currentRoleConfig.idLabel} *`
                      : "Official Defence Email *"}
                  </Label>
                  <Input
                    id="officialEmail"
                    type="email"
                    placeholder={currentRoleConfig?.inputType === "email" ? currentRoleConfig.placeholder : "yourname@gov.in"}
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    autoComplete="off"
                    aria-invalid={Boolean(emailError)}
                  />
                  {emailError ? (
                    <p className="text-xs text-[hsl(0,84%,60%)]">{emailError}</p>
                  ) : currentRoleConfig?.emailWarningMessage ? (
                    <p className="text-xs text-[hsl(25,95%,60%)]">{currentRoleConfig.emailWarningMessage}</p>
                  ) : currentRoleConfig?.tooltip ? (
                    <p className="text-xs text-[hsl(0,0%,45%)]">{currentRoleConfig.tooltip}</p>
                  ) : (
                    <p className="text-xs text-[hsl(0,0%,45%)]">Use your authorised defence email for verification.</p>
                  )}
                </div>
              )}
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

            <Button type="submit" className="w-full" size="lg">
              Continue to Security Check
            </Button>
          </form>
        )}

        {currentStep === 2 && (
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  aria-invalid={Boolean(passwordError)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(0,0%,31%)] hover:text-[hsl(213,100%,18%)] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordError ? (
                <p className="text-xs text-[hsl(0,84%,60%)]">{passwordError}</p>
              ) : (
                <Collapsible>
                  <div className="flex items-center gap-2 text-xs text-[hsl(0,0%,45%)]">
                    <span>Must satisfy the requirements below.</span>
                    <CollapsibleTrigger className="text-[hsl(207,90%,54%)] hover:underline">
                      View policy
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent className="mt-2">
                    <div className="bg-[hsl(210,40%,96.1%)] border border-[hsl(213,100%,18%)]/15 rounded-lg p-4 space-y-2">
                      <p className="text-sm font-semibold text-[hsl(213,100%,18%)]">Password policy</p>
                      <p className="text-xs text-[hsl(0,0%,31%)]">
                        Ensure your password complies with the security standards below.
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

            {currentRoleConfig?.enforcedMfaMethod && (
              <div className="bg-[hsl(210,40%,96.1%)] border border-[hsl(213,100%,18%)]/15 rounded-lg p-3 text-xs text-[hsl(0,0%,31%)]">
                Multi-factor authentication is mandatory for the selected role. Authenticator enforcement applies where specified.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>
                Back
              </Button>
              <Button type="submit" className="w-full" size="lg">
                Verify & Proceed to MFA
              </Button>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setShowSSOModal(true)}
            >
              Sign in via Defence SSO
            </Button>

            <div className="text-center">
              <Button variant="link" size="sm">
                Forgot password?
              </Button>
            </div>
          </form>
        )}

        <div className="text-center pt-2">
          <Button variant="link" size="sm" onClick={() => setShowVPNModal(true)}>
            Network verification help
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <>
        {pageContent}

        {/* SSO Modal */}
        <Dialog open={showSSOModal} onOpenChange={setShowSSOModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Defence SSO Authentication</DialogTitle>
              <DialogDescription>
                Defence Single Sign-On (SSO) allows you to use your enterprise credentials to access the portal securely.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm">
                You will be redirected to the official Defence authentication gateway. Please ensure you have your:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 text-[hsl(0,0%,31%)]">
                <li>Enterprise User ID</li>
                <li>Digital Certificate (if required)</li>
                <li>Hardware token (if applicable)</li>
              </ul>
              <Button className="w-full" onClick={() => toast({ title: "SSO redirect initiated" })}>
                Continue to SSO Gateway
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* VPN Warning Modal */}
        <Dialog open={showVPNModal} onOpenChange={setShowVPNModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[hsl(25,95%,60%)]" />
                Unverified Network Detected
              </DialogTitle>
              <DialogDescription>
                You appear to be accessing from a VPN or proxy network.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm">
                Your network connection could not be verified. You may continue, but this activity will be flagged for security review.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowVPNModal(false)}>
                  Cancel Login
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    setShowVPNModal(false);
                    toast({ title: "Login flagged", description: "Proceeding with security flag." });
                  }}
                >
                  Continue Anyway
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* NCRP Redirect Modal */}
        <Dialog open={showNCRPModal} onOpenChange={setShowNCRPModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Redirect to NCRP</DialogTitle>
              <DialogDescription>
                National Cybercrime Reporting Portal
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm">
                If you believe you are unauthorized or have witnessed cybercrime activity, you can report it to the National Cybercrime Reporting Portal (NCRP).
              </p>
              <Alert>
                <AlertDescription className="text-xs">
                  You will be redirected to: <strong>cybercrime.gov.in</strong>
                </AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowNCRPModal(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    toast({ title: "Redirecting to NCRP..." });
                    window.open("https://cybercrime.gov.in", "_blank");
                    setShowNCRPModal(false);
                  }}
                >
                  Redirect to NCRP
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    </TooltipProvider>
  );
};

export default LoginForm;
