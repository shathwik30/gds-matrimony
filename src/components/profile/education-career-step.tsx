"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
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
import { educationCareerSchema, type EducationCareerInput } from "@/lib/validations/profile";
import { EDUCATION_OPTIONS, EMPLOYED_IN_OPTIONS, OCCUPATION_OPTIONS, ANNUAL_INCOME_OPTIONS } from "@/constants";
import { useProfileStep, type ProfileStepProps } from "@/hooks/use-profile-step";

function getDefaults(data: Record<string, unknown>): EducationCareerInput {
  return {
    highestEducation: (data.highestEducation as string) || "",
    educationDetail: (data.educationDetail as string) || "",
    employedIn: (data.employedIn as string) || "",
    occupation: (data.occupation as string) || "",
    jobTitle: (data.jobTitle as string) || "",
    annualIncome: (data.annualIncome as string) || "",
  };
}

export function EducationCareerStep({ data, onUpdate, registerValidate }: ProfileStepProps) {
  const form = useForm<EducationCareerInput>({
    resolver: zodResolver(educationCareerSchema),
    defaultValues: getDefaults(data),
  });

  useProfileStep(form, data, onUpdate, registerValidate, getDefaults);

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="highestEducation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Highest Education *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select education" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {EDUCATION_OPTIONS.map((edu) => (
                      <SelectItem key={edu} value={edu.toLowerCase().replace(/ /g, "_")}>
                        {edu}
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
            name="educationDetail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Education Details</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., B.Tech from IIT Delhi" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="employedIn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employed In</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sector" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {EMPLOYED_IN_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option.toLowerCase().replace(/ /g, "_")}>
                        {option}
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
            name="occupation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Occupation</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select occupation" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {OCCUPATION_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option.toLowerCase().replace(/ /g, "_")}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="jobTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Senior Software Engineer" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="annualIncome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Annual Income</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select income range" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ANNUAL_INCOME_OPTIONS.map((option) => (
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
        </div>
      </form>
    </Form>
  );
}
