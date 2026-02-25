"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import { useDebounce } from "use-debounce";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function UsersSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "");
  const [debouncedSearch] = useDebounce(searchValue, 300);

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

      startTransition(() => {
        router.push(`/admin/users?${params.toString()}`);
      });
    }
  }, [debouncedSearch, searchParams, router]);

  const handleSearch = (value: string) => {
    setSearchValue(value);
  };

  const handleFilterChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set("filter", value);
    } else {
      params.delete("filter");
    }
    params.set("page", "1");

    startTransition(() => {
      router.push(`/admin/users?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search by name or email..."
          className="pl-10"
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <Select defaultValue={searchParams.get("filter") || "all"} onValueChange={handleFilterChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Users</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
          <SelectItem value="verified">Verified</SelectItem>
          <SelectItem value="unverified">Unverified</SelectItem>
        </SelectContent>
      </Select>

      {isPending && <div className="flex items-center text-sm text-slate-500">Loading...</div>}
    </div>
  );
}
