"use client";

import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";

interface CallAllButtonProps {
  campaignId: string;
}

export function CallAllButton({ campaignId }: CallAllButtonProps) {
  function handleCallAll() {
    // TODO: Implement call all functionality
    console.log("Call all clicked for campaign:", campaignId);
  }

  return (
    <Button onClick={handleCallAll} variant="default">
      <Phone className="mr-2 h-4 w-4" />
      Call All
    </Button>
  );
}
