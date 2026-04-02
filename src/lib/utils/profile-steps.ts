// Required fields per step — used to detect the first incomplete step
export const STEP_REQUIRED_FIELDS: string[][] = [
  ["firstName", "lastName", "gender", "dateOfBirth", "phoneNumber"], // Step 1
  ["height"], // Step 2
  ["religion", "motherTongue", "countryLivingIn", "residingState", "residingCity"], // Step 3
  ["highestEducation"], // Step 4
  ["maritalStatus"], // Step 5
  [], // Step 6 — all optional
  ["aboutMe"], // Step 7
  ["profileImage"], // Step 8
];

export function getFirstIncompleteStep(data: Record<string, unknown>): number {
  for (let i = 0; i < STEP_REQUIRED_FIELDS.length; i++) {
    const fields = STEP_REQUIRED_FIELDS[i];
    const hasEmpty = fields.some((f) => {
      const val = data[f];
      if (val === null || val === undefined || val === "") return true;
      if (f === "aboutMe" && typeof val === "string" && val.length < 50) return true;
      return false;
    });
    if (hasEmpty) return i + 1;
  }
  return 1; // All complete — start at step 1 for review
}

export function isStepComplete(stepIndex: number, data: Record<string, unknown>): boolean {
  const fields = STEP_REQUIRED_FIELDS[stepIndex];
  if (fields.length === 0) return true;
  return fields.every((f) => {
    const val = data[f];
    if (val === null || val === undefined || val === "") return false;
    if (f === "aboutMe" && typeof val === "string" && val.length < 50) return false;
    return true;
  });
}
