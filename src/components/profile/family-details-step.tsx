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
import { familyDetailsSchema, type FamilyDetailsInput } from "@/lib/validations/profile";
import {
  FAMILY_STATUS_OPTIONS,
  FAMILY_TYPE_OPTIONS,
  FAMILY_VALUE_OPTIONS,
  PARENT_OCCUPATION_OPTIONS,
} from "@/constants";
import { useProfileStep, type ProfileStepProps } from "@/hooks/use-profile-step";

function getDefaults(data: Record<string, unknown>): FamilyDetailsInput {
  return {
    familyStatus: (data.familyStatus as string) || "",
    familyType: (data.familyType as string) || "",
    familyValue: (data.familyValue as string) || "",
    fatherOccupation: (data.fatherOccupation as string) || "",
    motherOccupation: (data.motherOccupation as string) || "",
    brothers: (data.brothers as number) ?? undefined,
    brothersMarried: (data.brothersMarried as number) ?? undefined,
    sisters: (data.sisters as number) ?? undefined,
    sistersMarried: (data.sistersMarried as number) ?? undefined,
  };
}

export function FamilyDetailsStep({ data, onUpdate }: ProfileStepProps) {
  const form = useForm<FamilyDetailsInput>({
    resolver: zodResolver(familyDetailsSchema),
    defaultValues: getDefaults(data),
  });

  useProfileStep(form, data, onUpdate, undefined, getDefaults);

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="familyStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Family Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {FAMILY_STATUS_OPTIONS.map((option) => (
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
            name="familyType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Family Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {FAMILY_TYPE_OPTIONS.map((option) => (
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
            name="familyValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Family Values</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select values" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {FAMILY_VALUE_OPTIONS.map((option) => (
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

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="fatherOccupation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Father&apos;s Occupation</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select occupation" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PARENT_OCCUPATION_OPTIONS.map((option) => (
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
            name="motherOccupation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mother&apos;s Occupation</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select occupation" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PARENT_OCCUPATION_OPTIONS.map((option) => (
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
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="brothers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Brothers</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      placeholder="0"
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                      }
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="brothersMarried"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brothers Married</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      placeholder="0"
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                      }
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="sisters"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Sisters</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      placeholder="0"
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                      }
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sistersMarried"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sisters Married</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      placeholder="0"
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                      }
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </form>
    </Form>
  );
}
