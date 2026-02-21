"use client";

import { useEffect, useState, useMemo } from "react";
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
import { religionLocationSchema, type ReligionLocationInput } from "@/lib/validations/profile";
import { RELIGION_OPTIONS, CASTE_OPTIONS, MOTHER_TONGUE_OPTIONS, STATE_OPTIONS, CITIES_BY_STATE } from "@/constants";
import { useProfileStep, type ProfileStepProps } from "@/hooks/use-profile-step";

function getDefaults(data: Record<string, unknown>): ReligionLocationInput {
  return {
    religion: (data.religion as string) || "",
    caste: (data.caste as string) || "",
    subCaste: (data.subCaste as string) || "",
    motherTongue: (data.motherTongue as string) || "",
    gothra: (data.gothra as string) || "",
    countryLivingIn: (data.countryLivingIn as string) || "India",
    residingState: (data.residingState as string) || "",
    residingCity: (data.residingCity as string) || "",
    citizenship: (data.citizenship as string) || "Indian",
  };
}

export function ReligionLocationStep({ data, onUpdate, registerValidate }: ProfileStepProps) {
  const [selectedState, setSelectedState] = useState<string>((data.residingState as string) || "");
  const [selectedReligion, setSelectedReligion] = useState<string>((data.religion as string) || "");

  const form = useForm<ReligionLocationInput>({
    resolver: zodResolver(religionLocationSchema),
    defaultValues: getDefaults(data),
  });

  useProfileStep(form, data, onUpdate, registerValidate, getDefaults);

  // Sync local state when data changes (external prop → local state)
  useEffect(() => {
    setSelectedState((data.residingState as string) || ""); // eslint-disable-line react-hooks/set-state-in-effect
    setSelectedReligion((data.religion as string) || "");
  }, [data]);

  // Derive cities and castes from selected state/religion instead of syncing via effects
  const cities = useMemo(() => {
    if (selectedState && CITIES_BY_STATE[selectedState]) {
      return CITIES_BY_STATE[selectedState];
    }
    return [];
  }, [selectedState]);

  const castes = useMemo(() => {
    const religionKey = selectedReligion
      ? Object.keys(CASTE_OPTIONS).find(k => k.toLowerCase() === selectedReligion.toLowerCase())
      : undefined;
    if (religionKey && Object.prototype.hasOwnProperty.call(CASTE_OPTIONS, religionKey)) {
      return CASTE_OPTIONS[religionKey];
    }
    return [];
  }, [selectedReligion]);

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="religion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Religion *</FormLabel>
                <Select
                  onValueChange={(val) => {
                    field.onChange(val);
                    setSelectedReligion(val);
                    form.setValue("caste", "");
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select religion" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {RELIGION_OPTIONS.map((religion) => (
                      <SelectItem key={religion} value={religion.toLowerCase()}>
                        {religion}
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
            name="caste"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Caste</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select caste" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {castes.map((caste) => (
                      <SelectItem key={caste} value={caste.toLowerCase().replace(/ /g, "_")}>
                        {caste}
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
            name="subCaste"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sub-Caste</FormLabel>
                <FormControl>
                  <Input placeholder="Enter sub-caste" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gothra"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gothra</FormLabel>
                <FormControl>
                  <Input placeholder="Enter gothra" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="motherTongue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mother Tongue *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select mother tongue" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {MOTHER_TONGUE_OPTIONS.map((lang) => (
                    <SelectItem key={lang} value={lang.toLowerCase()}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="countryLivingIn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country Living In *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="India">India</SelectItem>
                    <SelectItem value="USA">USA</SelectItem>
                    <SelectItem value="UK">UK</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                    <SelectItem value="Australia">Australia</SelectItem>
                    <SelectItem value="UAE">UAE</SelectItem>
                    <SelectItem value="Singapore">Singapore</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="citizenship"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Citizenship</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select citizenship" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Indian">Indian</SelectItem>
                    <SelectItem value="American">American</SelectItem>
                    <SelectItem value="British">British</SelectItem>
                    <SelectItem value="Canadian">Canadian</SelectItem>
                    <SelectItem value="Australian">Australian</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
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
            name="residingState"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State *</FormLabel>
                <Select
                  onValueChange={(val) => {
                    field.onChange(val);
                    setSelectedState(val);
                    form.setValue("residingCity", "");
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STATE_OPTIONS.map((state) => (
                      <SelectItem key={state.value} value={state.value}>
                        {state.label}
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
            name="residingCity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
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
