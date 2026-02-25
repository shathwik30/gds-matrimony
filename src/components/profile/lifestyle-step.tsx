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
import { lifestyleSchema, type LifestyleInput } from "@/lib/validations/profile";
import {
  MARITAL_STATUS_OPTIONS,
  DIET_OPTIONS,
  SMOKING_OPTIONS,
  DRINKING_OPTIONS,
} from "@/constants";
import { useProfileStep, type ProfileStepProps } from "@/hooks/use-profile-step";

function getDefaults(data: Record<string, unknown>): LifestyleInput {
  return {
    maritalStatus:
      (data.maritalStatus as "never_married" | "divorced" | "widowed" | "awaiting_divorce") ||
      undefined!,
    diet: (data.diet as string) || "",
    smoking: (data.smoking as string) || "",
    drinking: (data.drinking as string) || "",
    hobbies: (data.hobbies as string) || "",
  };
}

export function LifestyleStep({ data, onUpdate, registerValidate }: ProfileStepProps) {
  const form = useForm<LifestyleInput>({
    resolver: zodResolver(lifestyleSchema),
    defaultValues: getDefaults(data),
  });

  useProfileStep(form, data, onUpdate, registerValidate, getDefaults);

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <FormField
          control={form.control}
          name="maritalStatus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marital Status *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select marital status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {MARITAL_STATUS_OPTIONS.map((option) => (
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

        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="diet"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Diet</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select diet" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DIET_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option.toLowerCase().replace(/-/g, "_")}>
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
            name="smoking"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Smoking</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SMOKING_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option.toLowerCase()}>
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
            name="drinking"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Drinking</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DRINKING_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option.toLowerCase()}>
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

        <FormField
          control={form.control}
          name="hobbies"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hobbies & Interests</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Reading, Music, Traveling, Cooking" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
