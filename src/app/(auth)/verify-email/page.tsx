"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Mail, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { verifyEmailOTP, resendOTP } from "@/lib/actions/auth";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setIsLoading(true);
    try {
      const result = await verifyEmailOTP({ email, otp });

      if (result.success) {
        setIsVerified(true);
        toast.success(result.message);
        setTimeout(() => {
          router.push("/profile/edit?onboarding=true");
        }, 2000);
      } else {
        toast.error(result.error || "Verification failed");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      const result = await resendOTP(email);

      if (result.success) {
        toast.success(result.message);
        setCountdown(60);
      } else {
        toast.error(result.error || "Failed to resend OTP");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Invalid verification link.</p>
            <Button asChild className="mt-4 w-full sm:w-auto">
              <Link href="/register">Go to Register</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 bg-brand-light">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6 pb-6 sm:pt-8 sm:pb-8">
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Email Verified!</h2>
            <p className="text-muted-foreground mb-6">
              Your email has been verified successfully. Let&apos;s complete your profile...
            </p>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/profile/edit?onboarding=true">Complete Profile</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 bg-brand-light">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/images/logo.png"
              alt="GDS Marriage Links"
              width={60}
              height={60}
            />
          </div>
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl sm:text-2xl">Verify Your Email</CardTitle>
          <CardDescription>
            We&apos;ve sent a 6-digit verification code to{" "}
            <span className="font-medium text-foreground">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            onClick={handleVerify}
            className="w-full"
            disabled={isLoading || otp.length !== 6}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify Email
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Didn&apos;t receive the code?{" "}
            <Button
              variant="link"
              className="p-0 h-auto"
              onClick={handleResend}
              disabled={isResending || countdown > 0}
            >
              {isResending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : countdown > 0 ? (
                `Resend in ${countdown}s`
              ) : (
                "Resend OTP"
              )}
            </Button>
          </div>

          <div className="text-center">
            <Link href="/register" className="text-sm text-primary hover:underline">
              Use a different email
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
