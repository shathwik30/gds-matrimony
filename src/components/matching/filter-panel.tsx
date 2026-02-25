"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SlidersHorizontal } from "lucide-react";
import { heightToFeetInches } from "@/lib/utils";
import {
  RELIGION_OPTIONS,
  CASTE_OPTIONS,
  MOTHER_TONGUE_OPTIONS,
  EDUCATION_OPTIONS,
  OCCUPATION_OPTIONS,
  ANNUAL_INCOME_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  DIET_OPTIONS,
  STATE_OPTIONS,
  CITIES_BY_STATE,
} from "@/constants";
import type { SearchFilters } from "@/types";

function parseArrayParam(params: URLSearchParams, key: string): string[] {
  const val = params.get(key);
  return val ? val.split(",") : [];
}

function parseNumberParam(params: URLSearchParams, key: string): number | undefined {
  const val = params.get(key);
  if (!val) return undefined;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? undefined : parsed;
}

export function FilterPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initFilters = useCallback((): SearchFilters => {
    return {
      ageMin: parseNumberParam(searchParams, "ageMin") ?? 18,
      ageMax: parseNumberParam(searchParams, "ageMax") ?? 70,
      heightMin: parseNumberParam(searchParams, "heightMin") ?? 140,
      heightMax: parseNumberParam(searchParams, "heightMax") ?? 190,
      religion: parseArrayParam(searchParams, "religion"),
      caste: parseArrayParam(searchParams, "caste"),
      motherTongue: parseArrayParam(searchParams, "motherTongue"),
      education: parseArrayParam(searchParams, "education"),
      profession: parseArrayParam(searchParams, "profession"),
      income: parseArrayParam(searchParams, "income"),
      maritalStatus: parseArrayParam(searchParams, "maritalStatus"),
      diet: parseArrayParam(searchParams, "diet"),
      state: parseArrayParam(searchParams, "state"),
      city: parseArrayParam(searchParams, "city"),
    };
  }, [searchParams]);

  const [filters, setFilters] = useState<SearchFilters>(initFilters);

  const toggleArrayValue = (key: keyof SearchFilters, value: string) => {
    setFilters((prev) => {
      const arr = (prev[key] as string[] | undefined) || [];
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...prev, [key]: next };
    });
  };

  const handleApply = () => {
    const params = new URLSearchParams();
    const sort = searchParams.get("sort");
    if (sort) params.set("sort", sort);

    if (filters.ageMin && filters.ageMin !== 18) params.set("ageMin", String(filters.ageMin));
    if (filters.ageMax && filters.ageMax !== 70) params.set("ageMax", String(filters.ageMax));
    if (filters.heightMin && filters.heightMin !== 140)
      params.set("heightMin", String(filters.heightMin));
    if (filters.heightMax && filters.heightMax !== 190)
      params.set("heightMax", String(filters.heightMax));

    const arrayKeys: { key: keyof SearchFilters; param: string }[] = [
      { key: "religion", param: "religion" },
      { key: "caste", param: "caste" },
      { key: "motherTongue", param: "motherTongue" },
      { key: "education", param: "education" },
      { key: "profession", param: "profession" },
      { key: "income", param: "income" },
      { key: "maritalStatus", param: "maritalStatus" },
      { key: "diet", param: "diet" },
      { key: "state", param: "state" },
      { key: "city", param: "city" },
    ];

    for (const { key, param } of arrayKeys) {
      const arr = filters[key] as string[] | undefined;
      if (arr?.length) params.set(param, arr.join(","));
    }

    router.push(`/matches?${params.toString()}`);
  };

  const handleClear = () => {
    const params = new URLSearchParams();
    const sort = searchParams.get("sort");
    if (sort) params.set("sort", sort);
    setFilters({
      ageMin: 18,
      ageMax: 70,
      heightMin: 140,
      heightMax: 190,
      religion: [],
      caste: [],
      motherTongue: [],
      education: [],
      profession: [],
      income: [],
      maritalStatus: [],
      diet: [],
      state: [],
      city: [],
    });
    router.push(`/matches?${params.toString()}`);
  };

  const activeCount = [
    (filters.ageMin ?? 18) !== 18 || (filters.ageMax ?? 70) !== 70,
    (filters.heightMin ?? 140) !== 140 || (filters.heightMax ?? 190) !== 190,
    (filters.religion?.length ?? 0) > 0,
    (filters.caste?.length ?? 0) > 0,
    (filters.motherTongue?.length ?? 0) > 0,
    (filters.education?.length ?? 0) > 0,
    (filters.profession?.length ?? 0) > 0,
    (filters.income?.length ?? 0) > 0,
    (filters.maritalStatus?.length ?? 0) > 0,
    (filters.diet?.length ?? 0) > 0,
    (filters.state?.length ?? 0) > 0,
    (filters.city?.length ?? 0) > 0,
  ].filter(Boolean).length;

  const availableCastes =
    (filters.religion?.length ?? 0) > 0
      ? filters.religion!.flatMap((r) => CASTE_OPTIONS[r] || [])
      : Object.values(CASTE_OPTIONS).flat();

  const availableCities =
    (filters.state?.length ?? 0) > 0
      ? filters.state!.flatMap((s) => CITIES_BY_STATE[s] || [])
      : Object.values(CITIES_BY_STATE).flat();

  return (
    <Card className="h-fit overflow-hidden">
      <div className="flex items-center justify-between border-b px-3 py-3 sm:px-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          <h3 className="text-sm font-semibold sm:text-base">Filters</h3>
          {activeCount > 0 && (
            <span className="bg-primary text-primary-foreground flex h-5 w-5 items-center justify-center rounded-full text-[10px]">
              {activeCount}
            </span>
          )}
        </div>
      </div>

      <div className="bg-muted/30 flex gap-2 border-b px-3 py-3 sm:px-4">
        <Button size="sm" onClick={handleApply} className="min-h-[40px] flex-1 sm:min-h-[36px]">
          Apply Filters
        </Button>
        {activeCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="min-h-[40px] flex-1 sm:min-h-[36px]"
          >
            Clear All
          </Button>
        )}
      </div>

      <div className="max-h-[calc(100vh-14rem)] overflow-y-auto px-3 py-2 sm:max-h-[calc(100vh-18rem)] sm:px-4">
        <Accordion type="multiple" defaultValue={["age", "religion"]} className="w-full">
          <AccordionItem value="age">
            <AccordionTrigger className="py-3 text-sm">
              Age Range
              {((filters.ageMin ?? 18) !== 18 || (filters.ageMax ?? 70) !== 70) && (
                <span className="text-muted-foreground mr-2 ml-auto text-xs">
                  {filters.ageMin}-{filters.ageMax}
                </span>
              )}
            </AccordionTrigger>
            <AccordionContent>
              <div className="px-1 pt-2 pb-1">
                <div className="text-muted-foreground mb-3 flex justify-between text-xs">
                  <span>{filters.ageMin ?? 18} yrs</span>
                  <span>{filters.ageMax ?? 70} yrs</span>
                </div>
                <Slider
                  value={[filters.ageMin ?? 18, filters.ageMax ?? 70]}
                  min={18}
                  max={70}
                  step={1}
                  onValueChange={([min, max]) =>
                    setFilters((prev) => ({ ...prev, ageMin: min, ageMax: max }))
                  }
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="height">
            <AccordionTrigger className="py-3 text-sm">
              Height Range
              {((filters.heightMin ?? 140) !== 140 || (filters.heightMax ?? 190) !== 190) && (
                <span className="text-muted-foreground mr-2 ml-auto text-xs">
                  {heightToFeetInches(filters.heightMin ?? 140)}-
                  {heightToFeetInches(filters.heightMax ?? 190)}
                </span>
              )}
            </AccordionTrigger>
            <AccordionContent>
              <div className="px-1 pt-2 pb-1">
                <div className="text-muted-foreground mb-3 flex justify-between text-xs">
                  <span>
                    {heightToFeetInches(filters.heightMin ?? 140)} ({filters.heightMin ?? 140} cm)
                  </span>
                  <span>
                    {heightToFeetInches(filters.heightMax ?? 190)} ({filters.heightMax ?? 190} cm)
                  </span>
                </div>
                <Slider
                  value={[filters.heightMin ?? 140, filters.heightMax ?? 190]}
                  min={140}
                  max={190}
                  step={1}
                  onValueChange={([min, max]) =>
                    setFilters((prev) => ({ ...prev, heightMin: min, heightMax: max }))
                  }
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="religion">
            <AccordionTrigger className="py-3 text-sm">
              Religion
              {(filters.religion?.length ?? 0) > 0 && (
                <span className="text-muted-foreground mr-2 ml-auto text-xs">
                  {filters.religion!.length} selected
                </span>
              )}
            </AccordionTrigger>
            <AccordionContent>
              <div className="max-h-40 space-y-1.5 overflow-y-auto">
                {RELIGION_OPTIONS.map((religion) => (
                  <label
                    key={religion}
                    className="flex cursor-pointer items-center gap-2 py-1 sm:py-0"
                  >
                    <Checkbox
                      checked={filters.religion?.includes(religion) ?? false}
                      onCheckedChange={() => toggleArrayValue("religion", religion)}
                    />
                    <span className="text-sm">{religion}</span>
                  </label>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="caste">
            <AccordionTrigger className="py-3 text-sm">
              Caste
              {(filters.caste?.length ?? 0) > 0 && (
                <span className="text-muted-foreground mr-2 ml-auto text-xs">
                  {filters.caste!.length} selected
                </span>
              )}
            </AccordionTrigger>
            <AccordionContent>
              <div className="max-h-40 space-y-1.5 overflow-y-auto">
                {[...new Set(availableCastes)].map((caste) => (
                  <label
                    key={caste}
                    className="flex cursor-pointer items-center gap-2 py-1 sm:py-0"
                  >
                    <Checkbox
                      checked={filters.caste?.includes(caste) ?? false}
                      onCheckedChange={() => toggleArrayValue("caste", caste)}
                    />
                    <span className="text-sm">{caste}</span>
                  </label>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="motherTongue">
            <AccordionTrigger className="py-3 text-sm">
              Mother Tongue
              {(filters.motherTongue?.length ?? 0) > 0 && (
                <span className="text-muted-foreground mr-2 ml-auto text-xs">
                  {filters.motherTongue!.length} selected
                </span>
              )}
            </AccordionTrigger>
            <AccordionContent>
              <div className="max-h-40 space-y-1.5 overflow-y-auto">
                {MOTHER_TONGUE_OPTIONS.map((lang) => (
                  <label key={lang} className="flex cursor-pointer items-center gap-2 py-1 sm:py-0">
                    <Checkbox
                      checked={filters.motherTongue?.includes(lang) ?? false}
                      onCheckedChange={() => toggleArrayValue("motherTongue", lang)}
                    />
                    <span className="text-sm">{lang}</span>
                  </label>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="education">
            <AccordionTrigger className="py-3 text-sm">
              Education
              {(filters.education?.length ?? 0) > 0 && (
                <span className="text-muted-foreground mr-2 ml-auto text-xs">
                  {filters.education!.length} selected
                </span>
              )}
            </AccordionTrigger>
            <AccordionContent>
              <div className="max-h-40 space-y-1.5 overflow-y-auto">
                {EDUCATION_OPTIONS.map((edu) => (
                  <label key={edu} className="flex cursor-pointer items-center gap-2 py-1 sm:py-0">
                    <Checkbox
                      checked={filters.education?.includes(edu) ?? false}
                      onCheckedChange={() => toggleArrayValue("education", edu)}
                    />
                    <span className="text-sm">{edu}</span>
                  </label>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="occupation">
            <AccordionTrigger className="py-3 text-sm">
              Occupation
              {(filters.profession?.length ?? 0) > 0 && (
                <span className="text-muted-foreground mr-2 ml-auto text-xs">
                  {filters.profession!.length} selected
                </span>
              )}
            </AccordionTrigger>
            <AccordionContent>
              <div className="max-h-40 space-y-1.5 overflow-y-auto">
                {OCCUPATION_OPTIONS.map((occ) => (
                  <label key={occ} className="flex cursor-pointer items-center gap-2 py-1 sm:py-0">
                    <Checkbox
                      checked={filters.profession?.includes(occ) ?? false}
                      onCheckedChange={() => toggleArrayValue("profession", occ)}
                    />
                    <span className="text-sm">{occ}</span>
                  </label>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="income">
            <AccordionTrigger className="py-3 text-sm">
              Annual Income
              {(filters.income?.length ?? 0) > 0 && (
                <span className="text-muted-foreground mr-2 ml-auto text-xs">
                  {filters.income!.length} selected
                </span>
              )}
            </AccordionTrigger>
            <AccordionContent>
              <div className="max-h-40 space-y-1.5 overflow-y-auto">
                {ANNUAL_INCOME_OPTIONS.map((inc) => (
                  <label
                    key={inc.value}
                    className="flex cursor-pointer items-center gap-2 py-1 sm:py-0"
                  >
                    <Checkbox
                      checked={filters.income?.includes(inc.value) ?? false}
                      onCheckedChange={() => toggleArrayValue("income", inc.value)}
                    />
                    <span className="text-sm">{inc.label}</span>
                  </label>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="maritalStatus">
            <AccordionTrigger className="py-3 text-sm">
              Marital Status
              {(filters.maritalStatus?.length ?? 0) > 0 && (
                <span className="text-muted-foreground mr-2 ml-auto text-xs">
                  {filters.maritalStatus!.length} selected
                </span>
              )}
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1.5">
                {MARITAL_STATUS_OPTIONS.map((ms) => (
                  <label
                    key={ms.value}
                    className="flex cursor-pointer items-center gap-2 py-1 sm:py-0"
                  >
                    <Checkbox
                      checked={filters.maritalStatus?.includes(ms.value) ?? false}
                      onCheckedChange={() => toggleArrayValue("maritalStatus", ms.value)}
                    />
                    <span className="text-sm">{ms.label}</span>
                  </label>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="diet">
            <AccordionTrigger className="py-3 text-sm">
              Diet
              {(filters.diet?.length ?? 0) > 0 && (
                <span className="text-muted-foreground mr-2 ml-auto text-xs">
                  {filters.diet!.length} selected
                </span>
              )}
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1.5">
                {DIET_OPTIONS.map((diet) => (
                  <label key={diet} className="flex cursor-pointer items-center gap-2 py-1 sm:py-0">
                    <Checkbox
                      checked={filters.diet?.includes(diet) ?? false}
                      onCheckedChange={() => toggleArrayValue("diet", diet)}
                    />
                    <span className="text-sm">{diet}</span>
                  </label>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="state">
            <AccordionTrigger className="py-3 text-sm">
              State
              {(filters.state?.length ?? 0) > 0 && (
                <span className="text-muted-foreground mr-2 ml-auto text-xs">
                  {filters.state!.length} selected
                </span>
              )}
            </AccordionTrigger>
            <AccordionContent>
              <div className="max-h-40 space-y-1.5 overflow-y-auto">
                {STATE_OPTIONS.map((st) => (
                  <label
                    key={st.value}
                    className="flex cursor-pointer items-center gap-2 py-1 sm:py-0"
                  >
                    <Checkbox
                      checked={filters.state?.includes(st.value) ?? false}
                      onCheckedChange={() => toggleArrayValue("state", st.value)}
                    />
                    <span className="text-sm">{st.label}</span>
                  </label>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {availableCities.length > 0 && (
            <AccordionItem value="city">
              <AccordionTrigger className="py-3 text-sm">
                City
                {(filters.city?.length ?? 0) > 0 && (
                  <span className="text-muted-foreground mr-2 ml-auto text-xs">
                    {filters.city!.length} selected
                  </span>
                )}
              </AccordionTrigger>
              <AccordionContent>
                <div className="max-h-40 space-y-1.5 overflow-y-auto">
                  {[...new Set(availableCities)].map((city) => (
                    <label
                      key={city}
                      className="flex cursor-pointer items-center gap-2 py-1 sm:py-0"
                    >
                      <Checkbox
                        checked={filters.city?.includes(city) ?? false}
                        onCheckedChange={() => toggleArrayValue("city", city)}
                      />
                      <span className="text-sm">{city}</span>
                    </label>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </div>
    </Card>
  );
}
