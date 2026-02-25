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
import { physicalDetailsSchema, type PhysicalDetailsInput } from "@/lib/validations/profile";
import {
  HEIGHT_OPTIONS,
  BODY_TYPE_OPTIONS,
  COMPLEXION_OPTIONS,
  PHYSICAL_STATUS_OPTIONS,
} from "@/constants";
import { useProfileStep, type ProfileStepProps } from "@/hooks/use-profile-step";

function getDefaults(data: Record<string, unknown>): PhysicalDetailsInput {
  return {
    height: (data.height as number) || undefined!,
    weight: (data.weight as number) || undefined,
    bodyType: (data.bodyType as string) || "",
    complexion: (data.complexion as string) || "",
    physicalStatus: (data.physicalStatus as string) || "",
  };
}

export function PhysicalDetailsStep({ data, onUpdate, registerValidate }: ProfileStepProps) {
  const form = useForm<PhysicalDetailsInput>({
    resolver: zodResolver(physicalDetailsSchema),
    defaultValues: getDefaults(data),
  });

  useProfileStep(form, data, onUpdate, registerValidate, getDefaults);

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="height"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Height (cm) *</FormLabel>
                <Select
                  onValueChange={(val) => field.onChange(parseInt(val))}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your height" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {HEIGHT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value.toString()}>
                        {opt.label}
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
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weight (kg)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter your weight"
                    {...field}
                    onChange={(e) =>
                      field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                    }
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="bodyType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Body Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select body type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {BODY_TYPE_OPTIONS.map((type) => (
                      <SelectItem key={type} value={type.toLowerCase()}>
                        {type}
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
            name="complexion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Complexion</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select complexion" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {COMPLEXION_OPTIONS.map((comp) => (
                      <SelectItem key={comp} value={comp.toLowerCase().replace(" ", "_")}>
                        {comp}
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
          name="physicalStatus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Physical Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select physical status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PHYSICAL_STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status.toLowerCase().replace(" ", "_")}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
