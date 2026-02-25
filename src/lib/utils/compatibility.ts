import { calculateAge } from "@/lib/utils";

const INCOME_ORDER: Record<string, number> = {
  upto_3: 0,
  "3_5": 1,
  "5_7": 2,
  "7_10": 3,
  "10_15": 4,
  "15_20": 5,
  "20_30": 6,
  "30_50": 7,
  "50_75": 8,
  "75_100": 9,
  above_100: 10,
};

const COMPATIBILITY_WEIGHTS = {
  religion: 15,
  caste: 10,
  age: 10,
  education: 8,
  income: 8,
  motherTongue: 7,
  maritalStatus: 7,
  occupation: 7,
  height: 5,
  state: 5,
  diet: 5,
  city: 4,
  country: 3,
  smoking: 3,
  drinking: 3,
} as const;

export interface CandidateProfile {
  userId: number;
  dateOfBirth: string | null;
  height: number | null;
  religion: string | null;
  caste: string | null;
  motherTongue: string | null;
  countryLivingIn: string | null;
  residingState: string | null;
  residingCity: string | null;
  highestEducation: string | null;
  occupation: string | null;
  annualIncome: string | null;
  maritalStatus: string | null;
  diet: string | null;
  smoking: string | null;
  drinking: string | null;
}

export interface PartnerPrefs {
  userId: number;
  ageMin: number | null;
  ageMax: number | null;
  heightMin: number | null;
  heightMax: number | null;
  religions: string[] | null;
  castes: string[] | null;
  motherTongues: string[] | null;
  countries: string[] | null;
  states: string[] | null;
  cities: string[] | null;
  educations: string[] | null;
  occupations: string[] | null;
  incomeMin: string | null;
  incomeMax: string | null;
  maritalStatuses: string[] | null;
  diets: string[] | null;
  smoking: string | null;
  drinking: string | null;
}

function scoreRange(
  value: number | null,
  min: number | null,
  max: number | null,
  grace: number
): number {
  if (value == null) return 0;
  if (min == null && max == null) return -1;

  let lo = min ?? -Infinity;
  let hi = max ?? Infinity;

  if (lo > hi) [lo, hi] = [hi, lo];

  if (value >= lo && value <= hi) return 1;

  if (grace <= 0) return 0;

  const dist = value < lo ? lo - value : value - hi;
  if (dist > grace) return 0;
  return 1 - dist / grace;
}

function scoreIncomeRange(value: string | null, min: string | null, max: string | null): number {
  if (value == null) return 0;
  if (min == null && max == null) return -1;

  const valOrd = INCOME_ORDER[value];
  if (valOrd === undefined) return 0;

  const loOrd = min != null ? INCOME_ORDER[min] : undefined;
  const hiOrd = max != null ? INCOME_ORDER[max] : undefined;

  let lo = loOrd ?? -Infinity;
  let hi = hiOrd ?? Infinity;

  if (lo > hi) [lo, hi] = [hi, lo];

  if (valOrd >= lo && valOrd <= hi) return 1;

  const dist = valOrd < lo ? lo - valOrd : valOrd - hi;
  if (dist > 1) return 0;
  return 0.5;
}

function scoreList(value: string | null, list: string[] | null): number {
  if (!list || list.length === 0) return -1;
  if (value == null) return 0;
  return list.includes(value) ? 1 : 0;
}

function scoreExact(value: string | null, pref: string | null): number {
  if (pref == null || pref === "") return -1;
  if (value == null) return 0;
  return value === pref ? 1 : 0;
}

export function calculateCompatibilityScore(
  preferences: PartnerPrefs | null | undefined,
  candidate: CandidateProfile
): number {
  if (!preferences) return 0;

  if (preferences.userId === candidate.userId) return 0;

  const candidateAge = candidate.dateOfBirth ? calculateAge(candidate.dateOfBirth) : null;

  const scores: { key: keyof typeof COMPATIBILITY_WEIGHTS; score: number }[] = [
    { key: "religion", score: scoreList(candidate.religion, preferences.religions) },
    { key: "caste", score: scoreList(candidate.caste, preferences.castes) },
    { key: "age", score: scoreRange(candidateAge, preferences.ageMin, preferences.ageMax, 2) },
    { key: "education", score: scoreList(candidate.highestEducation, preferences.educations) },
    {
      key: "income",
      score: scoreIncomeRange(candidate.annualIncome, preferences.incomeMin, preferences.incomeMax),
    },
    { key: "motherTongue", score: scoreList(candidate.motherTongue, preferences.motherTongues) },
    {
      key: "maritalStatus",
      score: scoreList(candidate.maritalStatus, preferences.maritalStatuses),
    },
    { key: "occupation", score: scoreList(candidate.occupation, preferences.occupations) },
    {
      key: "height",
      score: scoreRange(candidate.height, preferences.heightMin, preferences.heightMax, 5),
    },
    { key: "state", score: scoreList(candidate.residingState, preferences.states) },
    { key: "diet", score: scoreList(candidate.diet, preferences.diets) },
    { key: "city", score: scoreList(candidate.residingCity, preferences.cities) },
    { key: "country", score: scoreList(candidate.countryLivingIn, preferences.countries) },
    { key: "smoking", score: scoreExact(candidate.smoking, preferences.smoking) },
    { key: "drinking", score: scoreExact(candidate.drinking, preferences.drinking) },
  ];

  let weightedSum = 0;
  let activeWeight = 0;

  for (const { key, score } of scores) {
    if (score === -1) continue;
    const weight = COMPATIBILITY_WEIGHTS[key];
    weightedSum += weight * score;
    activeWeight += weight;
  }

  if (activeWeight === 0) return 0;

  return Math.round(Math.max(0, Math.min(100, (weightedSum / activeWeight) * 100)));
}
