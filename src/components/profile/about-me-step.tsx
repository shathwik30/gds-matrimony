"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { aboutMeSchema, type AboutMeInput } from "@/lib/validations/profile";
import { useProfileStep, type ProfileStepProps } from "@/hooks/use-profile-step";

function getDefaults(data: Record<string, unknown>): AboutMeInput {
  return {
    aboutMe: (data.aboutMe as string) || "",
  };
}

export function AboutMeStep({ data, onUpdate, registerValidate }: ProfileStepProps) {
  const form = useForm<AboutMeInput>({
    resolver: zodResolver(aboutMeSchema),
    defaultValues: getDefaults(data),
  });

  const aboutMeValue = form.watch("aboutMe");
  const charCount = aboutMeValue?.length || 0;

  useProfileStep(form, data, onUpdate, registerValidate, getDefaults);

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <FormField
          control={form.control}
          name="aboutMe"
          render={({ field }) => (
            <FormItem>
              <FormLabel>About Me *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Write about yourself, your personality, interests, what you're looking for in a partner, your family values, and anything else you'd like potential matches to know..."
                  className="min-h-[200px] resize-none"
                  maxLength={2000}
                  {...field}
                />
              </FormControl>
              <FormDescription className="flex justify-between">
                <span>
                  Write a thoughtful description to help potential matches know you better.
                </span>
                <span className={charCount < 50 ? "text-destructive" : ""}>
                  {charCount}/2000 characters
                </span>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium mb-2">Tips for a great profile description:</h4>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>Describe your personality and what makes you unique</li>
            <li>Mention your hobbies, interests, and passions</li>
            <li>Share your career aspirations and goals</li>
            <li>Talk about your family values and expectations</li>
            <li>Describe what you&apos;re looking for in a life partner</li>
            <li>Keep it genuine and positive</li>
          </ul>
        </div>
      </form>
    </Form>
  );
}
