"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useTransition, useCallback } from "react";
import { useDebounce } from "use-debounce";
import { Search, SlidersHorizontal, X, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RELIGION_OPTIONS, COUNTRY_OPTIONS, STATE_OPTIONS } from "@/constants";

const FILTER_KEYS = [
  "status",
  "gender",
  "subscription",
  "trustLevel",
  "married",
  "profileCompletion",
  "emailVerified",
  "religion",
  "country",
  "state",
  "joinedFrom",
  "joinedTo",
  "sort",
] as const;

function countActiveFilters(searchParams: URLSearchParams): number {
  return FILTER_KEYS.filter((key) => searchParams.has(key)).length;
}

export function UsersSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "");
  const [debouncedSearch] = useDebounce(searchValue, 300);
  const [showFilters, setShowFilters] = useState(() => countActiveFilters(searchParams) > 0);

  const activeFilterCount = countActiveFilters(searchParams);

  const pushParams = useCallback(
    (params: URLSearchParams) => {
      startTransition(() => {
        router.push(`/admin/users?${params.toString()}`);
      });
    },
    [router]
  );

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const currentSearch = params.get("search") || "";

    if (debouncedSearch !== currentSearch) {
      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      } else {
        params.delete("search");
      }
      params.set("page", "1");
      pushParams(params);
    }
  }, [debouncedSearch, searchParams, pushParams]);

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    // Remove legacy filter param
    params.delete("filter");
    pushParams(params);
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams();
    if (searchValue) params.set("search", searchValue);
    params.set("page", "1");
    pushParams(params);
  };

  const getFilter = (key: string) => searchParams.get(key) || "all";

  return (
    <div className="space-y-3">
      {/* Search bar + filter toggle */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name, email, or phone..."
            className="pl-10"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge className="ml-2 h-5 min-w-5 rounded-full bg-white px-1.5 text-xs text-slate-900">
                {activeFilterCount}
              </Badge>
            )}
            {showFilters ? (
              <ChevronUp className="ml-1 h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="ml-1 h-3.5 w-3.5" />
            )}
          </Button>

          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-slate-500">
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Clear all
            </Button>
          )}
        </div>

        {isPending && <div className="flex items-center text-sm text-slate-500">Loading...</div>}
      </div>

      {/* Active filter tags */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {FILTER_KEYS.map((key) => {
            const value = searchParams.get(key);
            if (!value) return null;
            const label = formatFilterLabel(key, value);
            return (
              <Badge key={key} variant="secondary" className="gap-1 pr-1 text-xs font-normal">
                {label}
                <button
                  onClick={() => setFilter(key, "all")}
                  className="hover:bg-muted ml-0.5 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Filter panel */}
      {showFilters && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {/* Account Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Account Status</label>
              <Select value={getFilter("status")} onValueChange={(v) => setFilter("status", v)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Gender */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Gender</label>
              <Select value={getFilter("gender")} onValueChange={(v) => setFilter("gender", v)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Subscription */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Subscription</label>
              <Select
                value={getFilter("subscription")}
                onValueChange={(v) => setFilter("subscription", v)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="platinum">Platinum</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Trust Level */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Trust Level</label>
              <Select
                value={getFilter("trustLevel")}
                onValueChange={(v) => setFilter("trustLevel", v)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="new_member">New Member</SelectItem>
                  <SelectItem value="verified_user">Verified</SelectItem>
                  <SelectItem value="highly_trusted">Highly Trusted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Married Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Married Status</label>
              <Select value={getFilter("married")} onValueChange={(v) => setFilter("married", v)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="married">Married</SelectItem>
                  <SelectItem value="unmarried">Not Married</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Profile Completion */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Profile Completion</label>
              <Select
                value={getFilter("profileCompletion")}
                onValueChange={(v) => setFilter("profileCompletion", v)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="complete">Complete (&ge;70%)</SelectItem>
                  <SelectItem value="incomplete">Incomplete (&lt;70%)</SelectItem>
                  <SelectItem value="empty">Empty (0%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Email Verified */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Email Verified</label>
              <Select
                value={getFilter("emailVerified")}
                onValueChange={(v) => setFilter("emailVerified", v)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Religion */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Religion</label>
              <Select value={getFilter("religion")} onValueChange={(v) => setFilter("religion", v)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {RELIGION_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r.toLowerCase()}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Country */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Country</label>
              <Select value={getFilter("country")} onValueChange={(v) => setFilter("country", v)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {COUNTRY_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* State */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">State</label>
              <Select value={getFilter("state")} onValueChange={(v) => setFilter("state", v)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {STATE_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Joined From */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Joined From</label>
              <Input
                type="date"
                className="h-9"
                value={searchParams.get("joinedFrom") || ""}
                onChange={(e) => setFilter("joinedFrom", e.target.value || "all")}
              />
            </div>

            {/* Joined To */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Joined To</label>
              <Input
                type="date"
                className="h-9"
                value={searchParams.get("joinedTo") || ""}
                onChange={(e) => setFilter("joinedTo", e.target.value || "all")}
              />
            </div>

            {/* Sort */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Sort By</label>
              <Select value={getFilter("sort")} onValueChange={(v) => setFilter("sort", v)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="last_active">Last Active</SelectItem>
                  <SelectItem value="name_asc">Name A-Z</SelectItem>
                  <SelectItem value="name_desc">Name Z-A</SelectItem>
                  <SelectItem value="completion_desc">Completion High-Low</SelectItem>
                  <SelectItem value="completion_asc">Completion Low-High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatFilterLabel(key: string, value: string): string {
  const labels: Record<string, Record<string, string>> = {
    status: { active: "Active", inactive: "Suspended" },
    gender: { male: "Male", female: "Female" },
    subscription: {
      free: "Free plan",
      basic: "Basic plan",
      silver: "Silver plan",
      gold: "Gold plan",
      platinum: "Platinum plan",
    },
    trustLevel: {
      new_member: "New Member",
      verified_user: "Verified",
      highly_trusted: "Highly Trusted",
    },
    married: { married: "Married", unmarried: "Not Married" },
    profileCompletion: {
      complete: "Profile Complete",
      incomplete: "Profile Incomplete",
      empty: "Profile Empty",
    },
    emailVerified: { verified: "Email Verified", unverified: "Email Unverified" },
    sort: {
      oldest: "Oldest first",
      last_active: "Last active",
      name_asc: "Name A-Z",
      name_desc: "Name Z-A",
      completion_desc: "Completion high-low",
      completion_asc: "Completion low-high",
    },
  };

  if (key === "joinedFrom") return `From: ${value}`;
  if (key === "joinedTo") return `To: ${value}`;
  if (key === "religion") return value.charAt(0).toUpperCase() + value.slice(1);
  if (key === "country") return value;
  if (key === "state") {
    const stateLabel = STATE_OPTIONS.find((s) => s.value === value)?.label;
    return stateLabel || value;
  }

  return labels[key]?.[value] || value;
}
