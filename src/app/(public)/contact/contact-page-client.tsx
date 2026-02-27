"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { isValidPhoneNumber } from "libphonenumber-js";
import { Loader2, Mail, Phone, MapPin, Clock, Send } from "lucide-react";
import { submitContactForm } from "@/lib/actions/contact";
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
    .refine((val) => !val || isValidPhoneNumber(val, "IN"), "Please enter a valid phone number"),
  subject: z.string().min(1, "Please select a subject"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactSettings {
  supportEmail: string;
  phone: string;
  phoneHref: string;
  address: string;
  workingHours: string;
}

const subjects = [
  "General Inquiry",
  "Technical Support",
  "Billing & Payments",
  "Profile Verification",
  "Report an Issue",
  "Partnership Inquiry",
  "Other",
];

export default function ContactPageClient({ contact }: { contact: ContactSettings }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const contactInfo = [
    {
      icon: Mail,
      title: "Email",
      value: contact.supportEmail,
      href: `mailto:${contact.supportEmail}`,
    },
    {
      icon: Phone,
      title: "Phone",
      value: contact.phone,
      href: contact.phoneHref,
    },
    {
      icon: MapPin,
      title: "Address",
      value: contact.address,
      href: null,
    },
    {
      icon: Clock,
      title: "Working Hours",
      value: contact.workingHours,
      href: null,
    },
  ];

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
      <section className="bg-brand-light py-10 sm:py-16 md:py-24">
        <div className="container-wide px-4 sm:px-6 md:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 text-2xl font-bold tracking-tight sm:mb-6 sm:text-3xl md:text-5xl">
              Contact Us
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg">
              Have questions or need assistance? We&apos;re here to help. Reach out to us and
              we&apos;ll respond as soon as possible.
            </p>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-16 md:py-24">
        <div className="container-wide px-4 sm:px-6 md:px-8">
          <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
            <div className="lg:col-span-1">
              <h2 className="mb-4 text-xl font-bold sm:mb-6 sm:text-2xl">Get in Touch</h2>
              <div className="space-y-6">
                {contactInfo.map((info, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="bg-brand-light flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
                      <info.icon className="text-brand h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{info.title}</p>
                      {info.href ? (
                        <a href={info.href} className="text-muted-foreground hover:text-brand">
                          {info.value}
                        </a>
                      ) : (
                        <p className="text-muted-foreground">{info.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-brand-light mt-6 rounded-xl p-4 sm:mt-8 sm:p-6">
                <h3 className="mb-2 font-semibold">Need Immediate Help?</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  Our customer support team is available to assist you during working hours.
                </p>
                <Button variant="outline" asChild>
                  <a href={contact.phoneHref}>
                    <Phone className="mr-2 h-4 w-4" />
                    Call Us Now
                  </a>
                </Button>
              </div>
            </div>

            <div className="lg:col-span-2">
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Send us a Message</CardTitle>
                  <CardDescription>
                    Fill out the form below and we&apos;ll get back to you within 24 hours.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid gap-4 md:grid-cols-2">
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
                                <Input type="email" placeholder="your@email.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input type="tel" placeholder="+91 98765 43210" {...field} />
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
                              <Select onValueChange={field.onChange} value={field.value}>
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

                      <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="mr-2 h-4 w-4" />
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

      <section className="bg-muted/50 py-10 sm:py-16 md:py-24">
        <div className="container-wide px-4 sm:px-6 md:px-8">
          <div className="mb-8 text-center sm:mb-12">
            <h2 className="mb-3 text-xl font-bold sm:mb-4 sm:text-2xl md:text-3xl">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              Find quick answers to common questions
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-4 sm:gap-6 md:grid-cols-2">
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
                  <h3 className="mb-2 font-semibold">{faq.q}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
