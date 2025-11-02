"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { VapiCallDialog } from "@/components/vapi-call-dialog";

interface CompanyCallSectionProps {
  companyData: {
    id: string;
    name: string;
    industry: string;
    revenue: number;
    ebitda: number;
    headcount: number;
    geography: string;
    dealStage: string;
    ownerBankerName: string;
    estimatedDealSize: number;
    likelihoodToSell: number;
  };
}

export function CompanyCallSection({ companyData }: CompanyCallSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Phone className="size-4" />
          Start Call
        </Button>
      </div>

      <VapiCallDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        companyData={companyData}
      />
    </>
  );
}
