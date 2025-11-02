"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { VapiCallDialog } from "@/components/vapi-call-dialog";

interface CompanyCallButtonProps {
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

export function CompanyCallButton({ companyData }: CompanyCallButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button size="sm" onClick={() => setDialogOpen(true)}>
        <Phone className="size-4" />
        Start Call
      </Button>

      <VapiCallDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        companyData={companyData}
      />
    </>
  );
}
