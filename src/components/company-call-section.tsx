"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { VapiCallDialog } from "@/components/vapi-call-dialog";
import { createCall } from "@/lib/calls";

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
    ownerBankerId: string;
    estimatedDealSize: number;
    likelihoodToSell: number;
  };
}

export function CompanyCallSection({ companyData }: CompanyCallSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [callId, setCallId] = useState<string | null>(null);
  const [isCreatingCall, setIsCreatingCall] = useState(false);

  const handleStartCall = async () => {
    setIsCreatingCall(true);

    try {
      // Create call in database before opening dialog
      const result = await createCall(companyData.id, companyData.ownerBankerId);

      if (result.success && result.callId) {
        setCallId(result.callId);
        setDialogOpen(true);
      } else {
        console.error("Failed to create call:", result.error);
        // TODO: Show error message to user
      }
    } catch (error) {
      console.error("Error creating call:", error);
      // TODO: Show error message to user
    } finally {
      setIsCreatingCall(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={handleStartCall} disabled={isCreatingCall}>
          <Phone className="size-4" />
          {isCreatingCall ? "Preparing..." : "Start Call"}
        </Button>
      </div>

      {callId && (
        <VapiCallDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          companyData={companyData}
          callId={callId}
        />
      )}
    </>
  );
}
