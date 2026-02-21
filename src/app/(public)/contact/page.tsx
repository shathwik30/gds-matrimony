"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { isValidPhoneNumber } from "libphonenumber-js";
import { Loader2, Mail, Phone, MapPin, Clock, Send } from "lucide-react";
import { submitContactForm } from "@/lib/actions/contact";
import { SITE_CONFIG } from "@/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Please enter a valid email"),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || isValidPhoneNumber(val, "IN"),
      "Please enter a valid phone number"
    ),
  subject: z.string().min(1, "Please select a subject"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormData = z.infer<typeof contactSchema>;

const contactInfo = [
  {
    icon: Mail,
    title: "Email",
    value: SITE_CONFIG.supportEmail,
    href: `mailto:${SITE_CONFIG.supportEmail}`,
  },
  {
    icon: Phone,
    title: "Phone",
    value: SITE_CONFIG.phone,
    href: SITE_CONFIG.phoneHref,
  },
  {
    icon: MapPin,
    title: "Address",
    value: SITE_CONFIG.address,
    href: null,
  },
  {
    icon: Clock,
    title: "Working Hours",
    value: SITE_CONFIG.workingHours,
    href: null,
  },
];

const subjects = [
  "General Inquiry",
  "Technical Support",
  "Billing & Payments",
  "Profile Verification",
  "Report an Issue",
  "Partnership Inquiry",
  "Other",
];

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      const result = await submitContactForm(data);

      if (result.success) {
        toast.success(result.message || "Message sent successfully! We'll get back to you soon.");
        form.reset();
      } else {
        toast.error(result.error || "Failed to send message. Please try again.");
      }
    } catch {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-brand-light py-10 sm:py-16 md:py-24">
        <div className="container-wide px-4 sm:px-6 md:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-6 tracking-tight">Contact Us</h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              Have questions or need assistance? We&apos;re here to help. Reach out
              to us and we&apos;ll respond as soon as possible.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-10 sm:py-16 md:py-24">
        <div className="container-wide px-4 sm:px-6 md:px-8">
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-12">
            {/* Contact Info */}
            <div className="lg:col-span-1">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Get in Touch</h2>
              <div className="space-y-6">
                {contactInfo.map((info, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-brand-light flex items-center justify-center flex-shrink-0">
                      <info.icon className="h-5 w-5 text-brand" />
                    </div>
                    <div>
                      <p className="font-medium">{info.title}</p>
                      {info.href ? (
                        <a
                          href={info.href}
                          className="text-muted-foreground hover:text-brand"
                        >
                          {info.value}
                        </a>
                      ) : (
                        <p className="text-muted-foreground">{info.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-brand-light rounded-xl">
                <h3 className="font-semibold mb-2">Need Immediate Help?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Our customer support team is available to assist you during
                  working hours.
                </p>
                <Button variant="outline" asChild>
                  <a href={SITE_CONFIG.phoneHref}>
                    <Phone className="h-4 w-4 mr-2" />
                    Call Us Now
                  </a>
                </Button>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Send us a Message</CardTitle>
                  <CardDescription>
                    Fill out the form below and we&apos;ll get back to you within 24
                    hours.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-6"
                    >
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Your name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email *</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="your@email.com"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input
                                  type="tel"
                                  placeholder="+91 98765 43210"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="subject"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Subject *</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a subject" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {subjects.map((subject) => (
                                    <SelectItem key={subject} value={subject}>
                                      {subject}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message *</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="How can we help you?"
                                className="min-h-[150px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full md:w-auto"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Send Message
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-10 sm:py-16 md:py-24 bg-muted/50">
        <div className="container-wide px-4 sm:px-6 md:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Find quick answers to common questions
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {[
              {
                q: "How do I verify my profile?",
                a: "You can verify your profile by uploading government-issued ID proof in the Settings section. Our team will review and verify within 24-48 hours.",
              },
              {
                q: "How can I upgrade my membership?",
                a: "Go to the Membership section in your dashboard and choose from our Silver, Gold, or Platinum plans. Payment is secure and instant.",
              },
              {
                q: "Can I hide my profile temporarily?",
                a: "Yes, you can hide your profile from the Privacy Settings. Your profile won't appear in search results while hidden.",
              },
              {
                q: "How do I report a suspicious profile?",
                a: "Click the Report button on any profile page or contact our support team. We take all reports seriously and investigate promptly.",
              },
            ].map((faq, index) => (
              <Card key={index} variant="elevated">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
