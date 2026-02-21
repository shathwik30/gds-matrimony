"use client";

import { useEffect } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";

export interface ProfileStepProps {
  data: Record<string, unknown>;
  onUpdate: (data: Record<string, unknown>) => void;
  registerValidate?: (fn: () => Promise<boolean>) => void;
}

export function useProfileStep<T extends FieldValues>(
  form: UseFormReturn<T>,
  data: Record<string, unknown>,
  onUpdate: (data: Record<string, unknown>) => void,
  registerValidate: ((fn: () => Promise<boolean>) => void) | undefined,
  getDefaults: (data: Record<string, unknown>) => Parameters<UseFormReturn<T>["reset"]>[0]
) {
  // Reset form when data changes (to load existing profile data)
  useEffect(() => {
    form.reset(getDefaults(data));
  }, [data, form, getDefaults]);

  // Register validation function for parent to call before advancing
  useEffect(() => {
    registerValidate?.(() => form.trigger());
  }, [registerValidate, form]);

  // Watch form values and update parent
  useEffect(() => {
    const subscription = form.watch((values) => {
      onUpdate(values as Record<string, unknown>);
    });
    return () => subscription.unsubscribe();
  }, [form, onUpdate]);
}
