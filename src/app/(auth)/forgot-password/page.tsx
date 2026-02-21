"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";
import { forgotPassword } from "@/lib/actions/auth";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true);
    try {
      const result = await forgotPassword(data);

      if (result.success) {
        setSubmittedEmail(data.email);
        setIsSubmitted(true);
        toast.success("Password reset link sent to your email");
      } else {
        toast.error(result.error || "Failed to send reset link");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-light relative">
        <div className="absolute inset-0 bg-gradient-to-br from-brand/10 to-transparent" />
        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-center">
          <Image
            src="/images/logo.svg"
            alt="GDS Marriage Links"
            width={80}
            height={80}
            className="mb-8"
          />
          <h1 className="text-4xl font-bold mb-4">Reset Your Password</h1>
          <p className="text-lg text-muted-foreground max-w-md">
            Don&apos;t worry, it happens to the best of us. We&apos;ll help you get back into your account.
          </p>
          <div className="mt-12">
            <Image
              src="/images/about2.jpg"
              alt="Secure"
              width={400}
              height={300}
              className="rounded-2xl shadow-2xl object-cover"
            />
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <Card className="w-full max-w-md border-0 shadow-none lg:shadow-lg lg:border">
          <CardHeader className="text-center">
            <div className="lg:hidden flex justify-center mb-4">
              <Image
                src="/images/logo.svg"
                alt="GDS Marriage Links"
                width={60}
                height={60}
              />
            </div>
            {isSubmitted ? (
              <>
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-xl sm:text-2xl">Check Your Email</CardTitle>
                <CardDescription>
                  We&apos;ve sent a password reset link to <strong>{submittedEmail}</strong>
                </CardDescription>
              </>
            ) : (
              <>
                <CardTitle className="text-xl sm:text-2xl">Forgot Password?</CardTitle>
                <CardDescription>
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent>
            {isSubmitted ? (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                  <p className="mb-2">
                    <strong>Didn&apos;t receive the email?</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Check your spam or junk folder</li>
                    <li>Make sure you entered the correct email</li>
                    <li>Wait a few minutes and try again</li>
                  </ul>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setIsSubmitted(false);
                    form.reset();
                  }}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Try a Different Email
                </Button>

                <div className="text-center">
                  <Link
                    href="/login"
                    className="text-sm text-primary hover:underline inline-flex items-center"
                  >
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Back to Login
                  </Link>
                </div>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Enter your registered email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Reset Link
                  </Button>
                </form>
              </Form>
            )}

            {!isSubmitted && (
              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="text-sm text-primary hover:underline inline-flex items-center"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Back to Login
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
