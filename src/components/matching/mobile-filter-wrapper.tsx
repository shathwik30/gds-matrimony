"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SlidersHorizontal } from "lucide-react";
import { FilterPanel } from "./filter-panel";

export function MobileFilterWrapper() {
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();

  // Close sheet when search params change (filters applied or cleared)
  useEffect(() => {
    setOpen(false); // eslint-disable-line react-hooks/set-state-in-effect
  }, [searchParams]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="default" className="xl:hidden">
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[320px] overflow-y-auto p-0">
        <SheetHeader className="px-4 pt-4 pb-2">
          <SheetTitle>Filter Profiles</SheetTitle>
        </SheetHeader>
        <FilterPanel />
      </SheetContent>
    </Sheet>
  );
}
