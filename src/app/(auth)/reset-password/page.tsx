"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";
import { resetPassword } from "@/lib/actions/auth";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    if (!token) {
      toast.error("Invalid reset link");
      return;
    }

    setIsLoading(true);
    try {
      const result = await resetPassword({ ...data, token });

      if (result.success) {
        setIsSuccess(true);
        toast.success("Password reset successfully!");
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        toast.error(result.error || "Failed to reset password");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <Card className="w-full max-w-md border-0 shadow-none lg:border lg:shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-destructive text-xl sm:text-2xl">Invalid Link</CardTitle>
          <CardDescription>This password reset link is invalid or has expired.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/forgot-password">Request New Link</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md border-0 shadow-none lg:border lg:shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-xl sm:text-2xl">Password Reset!</CardTitle>
          <CardDescription>
            Your password has been successfully reset. You&apos;ll be redirected to login shortly.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/login">Go to Login</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-0 shadow-none lg:border lg:shadow-lg">
      <CardHeader className="text-center">
        <div className="mb-4 flex justify-center lg:hidden">
          <Image src="/images/logo.svg" alt="GDS Marriage Links" width={60} height={60} />
        </div>
        <CardTitle className="text-xl sm:text-2xl">Create New Password</CardTitle>
        <CardDescription>
          Enter your new password below. Make sure it&apos;s strong and secure.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <PasswordInput placeholder="Enter new password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <PasswordInput placeholder="Confirm new password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-muted/50 text-muted-foreground rounded-lg p-3 text-sm">
              <p className="mb-1 font-medium">Password requirements:</p>
              <ul className="list-inside list-disc space-y-1 text-xs">
                <li>At least 8 characters long</li>
                <li>Contains both letters and numbers</li>
              </ul>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset Password
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-primary inline-flex items-center text-sm hover:underline"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen">
      <div className="bg-brand-light relative hidden lg:flex lg:w-1/2">
        <div className="from-brand/10 absolute inset-0 bg-gradient-to-br to-transparent" />
        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-center">
          <Image
            src="/images/logo.svg"
            alt="GDS Marriage Links"
            width={80}
            height={80}
            className="mb-8"
          />
          <h1 className="mb-4 text-4xl font-bold">Reset Your Password</h1>
          <p className="text-muted-foreground max-w-md text-lg">
            Create a strong, secure password to protect your account.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-4 sm:p-6 md:p-8">
        <Suspense
          fallback={
            <div className="w-full max-w-md">
              <Loader2 className="mx-auto h-8 w-8 animate-spin" />
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
