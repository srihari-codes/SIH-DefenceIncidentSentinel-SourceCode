import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Loader2, Mail, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link. Token is missing.");
        return;
      }

      try {
        const response = await fetch(`http://localhost:3001/api/auth/verify-email/${token}`);
        const data = await response.json();

        if (data.success) {
          setStatus("success");
          setMessage("Your email has been successfully verified!");
          setUserEmail(data.user?.email || "");
          
          toast({
            title: "Email Verified!",
            description: "You can now log in to your account.",
          });

          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate("/login");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(data.message || "Email verification failed.");
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("error");
        setMessage("An error occurred during verification. Please try again.");
      }
    };

    verifyEmail();
  }, [searchParams, navigate, toast]);

  const handleResendVerification = async () => {
    if (!userEmail) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to resend verification.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("http://localhost:3001/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Email Sent",
          description: "A new verification email has been sent to your inbox.",
        });
      } else {
        toast({
          title: "Failed to Send",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend verification email.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(213,100%,18%)] to-[hsl(207,90%,54%)] p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {status === "verifying" && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <Loader2 className="w-16 h-16 text-[hsl(213,100%,18%)] animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-[hsl(213,100%,18%)]">Verifying Your Email</h2>
              <p className="text-sm text-[hsl(0,0%,31%)]">
                Please wait while we verify your email address...
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[hsl(213,100%,18%)]">Email Verified!</h2>
                <p className="text-sm text-[hsl(0,0%,31%)] mt-2">{message}</p>
              </div>
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-sm text-green-800">
                  Your account is now active. Redirecting to login...
                </AlertDescription>
              </Alert>
              <Button
                className="w-full"
                onClick={() => navigate("/login")}
              >
                Continue to Login
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                    <XCircle className="w-10 h-10 text-red-600" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-[hsl(213,100%,18%)]">Verification Failed</h2>
                <p className="text-sm text-[hsl(0,0%,31%)] mt-2">{message}</p>
              </div>

              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {message.includes("expired") 
                    ? "Your verification link has expired. Request a new one below."
                    : "The verification link is invalid or has already been used."}
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleResendVerification}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Resend Verification Email
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => navigate("/")}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-white/80">
          <p>Defence Incident Sentinel Portal</p>
          <p className="text-xs mt-1">Ministry of Defence | Government of India</p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
