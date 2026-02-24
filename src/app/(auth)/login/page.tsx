"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { loginUser } from "@/lib/actions/auth";

function LoginForm() {
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get("callbackUrl") || "/dashboard";
  // Strict validation: must start with /, no protocol-relative URLs, no encoded slashes, no backslashes
  const isValidCallback = /^\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]*$/.test(rawCallback) &&
    !rawCallback.startsWith("//") &&
    !rawCallback.includes("\\") &&
    !rawCallback.includes("%2f") &&
    !rawCallback.includes("%2F") &&
    !rawCallback.includes("%5c") &&
    !rawCallback.includes("%5C");
  const callbackUrl = isValidCallback ? rawCallback : "/dashboard";
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      const result = await loginUser(data);

      if (result.success) {
        toast.success("Login successful!");
        // Redirect admins to admin panel, others to callbackUrl
        const redirectTo = result.data?.isAdmin ? "/admin" : callbackUrl;
        // Use window.location to force full page reload and refresh session
        // eslint-disable-next-line react-hooks/immutability
        window.location.href = redirectTo;
      } else {
        toast.error(result.error || "Login failed");
        setIsLoading(false);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
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
        <CardTitle className="text-xl sm:text-2xl">Login to Your Account</CardTitle>
        <CardDescription>
          Enter your email and password to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="Enter your password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-primary font-medium hover:underline">
            Register Free
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-light relative items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-brand/10 to-transparent" />
        <div className="relative z-10 flex flex-col items-center p-12 text-center">
          <Image
            src="/images/logo.svg"
            alt="GDS Marriage Links"
            width={80}
            height={80}
            className="mb-8"
          />
          <h1 className="text-4xl font-bold mb-4">Welcome Back!</h1>
          <p className="text-lg text-muted-foreground max-w-md">
            Log in to continue your journey towards finding your perfect life partner.
          </p>
          <div className="mt-12">
            <Image
              src="/images/about2.jpg"
              alt="Happy couple"
              width={400}
              height={300}
              className="rounded-2xl shadow-2xl object-cover"
            />
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <Suspense fallback={<div className="w-full max-w-md"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
