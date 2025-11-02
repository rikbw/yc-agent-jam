"use client";

import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface SearchParamsSectionProps {
  searchParams: unknown;
}

export function SearchParamsSection({ searchParams }: SearchParamsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Search Parameters</h3>
          <p className="text-xs text-muted-foreground">
            Target criteria for this campaign
          </p>
        </div>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm">
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
            <span className="sr-only">Toggle search parameters</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="mt-3">
        <pre className="text-xs font-mono bg-muted p-4 rounded-md overflow-x-auto">
          {JSON.stringify(searchParams, null, 2)}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  );
}
