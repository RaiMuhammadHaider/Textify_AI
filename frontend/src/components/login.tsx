import React, { useState } from "react";
import { ArrowLeft, Bot, Loader2, MailCheck, ShieldCheck } from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "./ui/input-otp";
import { Label } from "./ui/label";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../hooks/use-toast";

interface LoginProps {
  onSwitchToSignup: () => void;
}

type AuthStep = "login" | "loginOtp" | "forgotEmail" | "forgotOtp" | "resetPassword";

export const Login: React.FC<LoginProps> = ({ onSwitchToSignup }) => {
  const [step, setStep] = useState<AuthStep>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    login,
    verifyLoginOtp,
    forgotPassword,
    verifyResetOtp,
    resetPassword,
  } = useAuth();
  const { toast } = useToast();

  const isOtpStep = step === "loginOtp" || step === "forgotOtp";

  const getErrorDescription = (error: any, fallback: string) => {
    const errorData = error.response?.data;

    if (errorData) {
      if (Array.isArray(errorData.message)) {
        return errorData.message.join(", ");
      }
      if (typeof errorData.message === "string") {
        return errorData.message;
      }
      if (errorData.error) {
        return errorData.error;
      }
    }

    return error.message || fallback;
  };

  const resetToLogin = () => {
    setStep("login");
    setOtp("");
    setNewPassword("");
  };

  const handleLogin = async () => {
    if (!email || !password) return;

    await login(email, password);
    setOtp("");
    setStep("loginOtp");
    toast({
      title: "OTP sent",
      description: "Check your email to complete login.",
    });
  };

  const handleLoginOtp = async () => {
    if (otp.length !== 6) return;

    await verifyLoginOtp(otp);
    toast({
      title: "Success",
      description: "Logged in successfully!",
    });
  };

  const handleForgotEmail = async () => {
    if (!email) return;

    await forgotPassword(email);
    setOtp("");
    setStep("forgotOtp");
    toast({
      title: "OTP sent",
      description: "Check your email to reset your password.",
    });
  };

  const handleForgotOtp = async () => {
    if (otp.length !== 6) return;

    await verifyResetOtp(otp);
    setStep("resetPassword");
    toast({
      title: "OTP verified",
      description: "Set a new password to continue.",
    });
  };

  const handleResetPassword = async () => {
    if (otp.length !== 6 || !newPassword) return;

    await resetPassword(otp, newPassword);
    toast({
      title: "Password updated",
      description: "You are signed in now.",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      if (step === "login") {
        await handleLogin();
      } else if (step === "loginOtp") {
        await handleLoginOtp();
      } else if (step === "forgotEmail") {
        await handleForgotEmail();
      } else if (step === "forgotOtp") {
        await handleForgotOtp();
      } else {
        await handleResetPassword();
      }
    } catch (error: any) {
      console.error("Authentication error details:", error.response?.data);
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: getErrorDescription(
          error,
          "Something went wrong. Please try again.",
        ),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const screenCopy = {
    login: {
      title: "Welcome Back",
      description: "Enter your credentials to access your account.",
      action: "Log In",
      loading: "Logging in...",
    },
    loginOtp: {
      title: "Verify Login OTP",
      description: "Enter the OTP sent to your email.",
      action: "Verify OTP",
      loading: "Verifying...",
    },
    forgotEmail: {
      title: "Reset Password",
      description: "Enter your email and we will send a reset OTP.",
      action: "Send OTP",
      loading: "Sending...",
    },
    forgotOtp: {
      title: "Verify Reset OTP",
      description: "Enter the OTP sent to your email.",
      action: "Verify OTP",
      loading: "Verifying...",
    },
    resetPassword: {
      title: "Create New Password",
      description: "Choose a new password for your account.",
      action: "Update Password",
      loading: "Updating...",
    },
  }[step];

  return (
    <div className="flex h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto">
            {isOtpStep ? (
              <ShieldCheck className="h-6 w-6 text-primary-foreground" />
            ) : step === "forgotEmail" || step === "resetPassword" ? (
              <MailCheck className="h-6 w-6 text-primary-foreground" />
            ) : (
              <Bot className="h-6 w-6 text-primary-foreground" />
            )}
          </div>
          <CardTitle className="text-xl font-semibold">
            {screenCopy.title}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {screenCopy.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {(step === "login" || step === "forgotEmail") && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            )}

            {step === "login" && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            )}

            {isOtpStep && (
              <div className="space-y-2">
                <Label htmlFor="otp">OTP</Label>
                <InputOTP
                  id="otp"
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                  containerClassName="justify-center"
                >
                  <InputOTPGroup>
                    {Array.from({ length: 6 }).map((_, index) => (
                      <InputOTPSlot key={index} index={index} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
            )}

            {step === "resetPassword" && (
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {screenCopy.loading}
                </>
              ) : (
                screenCopy.action
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          {step === "login" ? (
            <>
              <button
                onClick={() => {
                  setStep("forgotEmail");
                  setPassword("");
                  setOtp("");
                }}
                className="text-sm font-medium text-primary hover:underline"
              >
                Forgot password?
              </button>
              <div className="text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <button
                  onClick={onSwitchToSignup}
                  className="font-medium text-primary hover:underline"
                >
                  Sign up
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={resetToLogin}
              className="inline-flex items-center text-sm font-medium text-primary hover:underline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};
