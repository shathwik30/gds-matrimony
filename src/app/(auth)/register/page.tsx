"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { registerUser } from "@/lib/actions/auth";
import { PROFILE_FOR_OPTIONS } from "@/constants";

const MANDATORY_DECLARATIONS = [
  "I am legally eligible to marry under applicable laws.",
  "The information provided in my profile is true, accurate, and updated to the best of my knowledge. I take the whole responsibility of any false information updated in the profile.",
  "I am registering on this platform strictly for genuine matrimonial purposes.",
  "I agree not to misuse the platform for commercial, unlawful, or inappropriate activities.",
  "I understand that the platform acts only as a facilitator and does not guarantee the authenticity of other profiles.",
  "I consent to the collection, storage, and processing of my personal information (including photos, contact details, educational, professional, and family details) for matchmaking purposes.",
  "I understand that my profile information will be visible to registered members according to my selected privacy settings.",
  "I acknowledge that my data will be handled in accordance with the website's Privacy Policy and applicable data protection laws.",
  "I understand that I can edit, update, or delete my profile at any time, and may request account deletion subject to applicable policies.",
  "I agree to maintain confidentiality of my login credentials.",
] as const;

const OPTIONAL_CONSENTS = [
  "I agree to receive match alerts and service updates via Email.",
  "I agree to receive SMS/WhatsApp notifications.",
  "I agree to receive promotional offers and marketing communications (optional).",
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [mandatoryChecked, setMandatoryChecked] = useState<boolean[]>(() =>
    new Array(MANDATORY_DECLARATIONS.length).fill(false)
  );
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [optionalChecked, setOptionalChecked] = useState<boolean[]>(() =>
    new Array(OPTIONAL_CONSENTS.length).fill(false)
  );
  const pendingData = useRef<RegisterInput | null>(null);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      profileFor: "myself",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleFormSubmit = (data: RegisterInput) => {
    pendingData.current = data;
    setMandatoryChecked(new Array(MANDATORY_DECLARATIONS.length).fill(false));
    setTermsAccepted(false);
    setOptionalChecked(new Array(OPTIONAL_CONSENTS.length).fill(false));
    setShowConsent(true);
  };

  const handleConsentAgree = async () => {
    if (!pendingData.current) return;
    setShowConsent(false);
    setIsLoading(true);
    try {
      const result = await registerUser(pendingData.current);
      if (result.success) {
        toast.success(result.message);
        router.push(`/verify-email?email=${encodeURIComponent(pendingData.current.email)}`);
      } else {
        toast.error(result.error || "Registration failed");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
      pendingData.current = null;
    }
  };

  const toggleMandatory = (index: number) => {
    setMandatoryChecked((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const toggleOptional = (index: number) => {
    setOptionalChecked((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const allMandatoryChecked = mandatoryChecked.every(Boolean) && termsAccepted;

  const password = form.watch("password");
  const passwordRequirements = [
    { met: password.length >= 8, text: "At least 8 characters" },
    { met: /[a-zA-Z]/.test(password), text: "Contains letters" },
    { met: /[0-9]/.test(password), text: "Contains numbers" },
  ];

  return (
    <div className="flex min-h-screen">
      <div className="bg-brand-light relative hidden items-center justify-center lg:flex lg:w-1/2">
        <div className="from-brand/10 absolute inset-0 bg-gradient-to-br to-transparent" />
        <div className="relative z-10 flex flex-col items-center p-12 text-center">
          <Image
            src="/images/logo.svg"
            alt="GDS Marriage Links"
            width={80}
            height={80}
            className="mb-8"
          />
          <h1 className="mb-4 text-4xl font-bold">Start Your Journey</h1>
          <p className="text-muted-foreground max-w-md text-lg">
            Create your free profile and find your perfect life partner among thousands of verified
            profiles.
          </p>
          <div className="mt-8 space-y-4 text-left">
            {[
              "100% Verified Profiles",
              "Strong Privacy Controls",
              "Family-Friendly Platform",
              "Smart Matchmaking",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <span className="font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-4 sm:p-6 md:p-8">
        <Card className="w-full max-w-md border-0 shadow-none lg:border lg:shadow-lg">
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center lg:hidden">
              <Image src="/images/logo.svg" alt="GDS Marriage Links" width={60} height={60} />
            </div>
            <CardTitle className="text-xl sm:text-2xl">Create Your Account</CardTitle>
            <CardDescription>
              Join thousands of verified members looking for their life partner
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="profileFor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>This Profile is For</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select who this profile is for" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PROFILE_FOR_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter your email" {...field} />
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
                        <PasswordInput placeholder="Create a password" {...field} />
                      </FormControl>
                      {password && (
                        <div className="mt-2 space-y-1">
                          {passwordRequirements.map((req) => (
                            <div
                              key={req.text}
                              className={`flex items-center gap-2 text-xs ${
                                req.met ? "text-green-600" : "text-muted-foreground"
                              }`}
                            >
                              <Check
                                className={`h-3 w-3 ${req.met ? "opacity-100" : "opacity-30"}`}
                              />
                              {req.text}
                            </div>
                          ))}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <PasswordInput placeholder="Confirm your password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </form>
            </Form>

            <div className="text-muted-foreground mt-6 text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showConsent} onOpenChange={setShowConsent}>
        <DialogContent className="flex max-h-[85vh] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
          <div className="shrink-0 border-b px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                <ShieldCheck className="text-primary h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg">User Declaration & Privacy Consent</DialogTitle>
                <DialogDescription>
                  Please read and accept the following before proceeding
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="space-y-4 px-4 py-4 sm:space-y-5 sm:px-6 sm:py-5">
              <p className="text-muted-foreground text-sm">
                By creating an account, I confirm that:
              </p>

              <div className="space-y-3.5">
                {MANDATORY_DECLARATIONS.map((text, i) => (
                  <label
                    key={i}
                    className="group hover:bg-muted/50 -mx-2 flex cursor-pointer items-start gap-3 rounded-lg p-2 transition-colors"
                  >
                    <Checkbox
                      checked={mandatoryChecked[i]}
                      onCheckedChange={() => toggleMandatory(i)}
                      className="mt-0.5 shrink-0"
                    />
                    <span className="text-muted-foreground group-hover:text-foreground text-sm leading-relaxed transition-colors">
                      {text}
                    </span>
                  </label>
                ))}

                <label className="group hover:bg-muted/50 -mx-2 flex cursor-pointer items-start gap-3 rounded-lg p-2 transition-colors">
                  <Checkbox
                    checked={termsAccepted}
                    onCheckedChange={() => setTermsAccepted((p) => !p)}
                    className="mt-0.5 shrink-0"
                  />
                  <span className="text-sm leading-relaxed font-medium">
                    I have read and agree to the{" "}
                    <Link
                      href="/terms"
                      target="_blank"
                      className="text-primary font-semibold hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Terms & Conditions
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      target="_blank"
                      className="text-primary font-semibold hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>
              </div>

              <div className="border-t" />

              <div>
                <p className="mb-3 text-sm font-semibold">Optional Communication Consent</p>
                <div className="space-y-3">
                  {OPTIONAL_CONSENTS.map((text, i) => (
                    <label
                      key={i}
                      className="group hover:bg-muted/50 -mx-2 flex cursor-pointer items-start gap-3 rounded-lg p-2 transition-colors"
                    >
                      <Checkbox
                        checked={optionalChecked[i]}
                        onCheckedChange={() => toggleOptional(i)}
                        className="mt-0.5 shrink-0"
                      />
                      <span className="text-muted-foreground group-hover:text-foreground text-sm leading-relaxed transition-colors">
                        {text}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-muted/30 shrink-0 border-t px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-muted-foreground hidden text-xs sm:block">
                {mandatoryChecked.filter(Boolean).length + (termsAccepted ? 1 : 0)}/
                {MANDATORY_DECLARATIONS.length + 1} required
              </p>
              <div className="flex w-full gap-3 sm:ml-auto sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConsent(false)}
                  className="flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleConsentAgree}
                  disabled={!allMandatoryChecked}
                  className="flex-1 sm:flex-none"
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />I Agree & Register
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
