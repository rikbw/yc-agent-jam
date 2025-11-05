"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Loader2, PhoneOff } from "lucide-react";
import type { Call } from "@/types/call";

interface CompanyCallButtonProps {
  calls: Call[];
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

type CallStatus = "idle" | "initiating" | "calling" | "completed" | "error";

export function CompanyCallButton({ companyData }: CompanyCallButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validatePhoneNumber = (number: string): boolean => {
    // Basic E.164 format validation: +[country code][number]
    // Must start with +, followed by 10-15 digits
    const e164Regex = /^\+\d{10,15}$/;
    return e164Regex.test(number);
  };

  const handleOpenDialog = () => {
    setDialogOpen(true);
    setCallStatus("idle");
    setPhoneNumber("");
    setPhoneError(null);
    setErrorMessage(null);
  };

  const handleInitiateCall = async () => {
    // Validate phone number
    if (!phoneNumber) {
      setPhoneError("Please enter a phone number");
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setPhoneError("Invalid format. Use E.164 format: +13243244444");
      return;
    }

    setPhoneError(null);
    setCallStatus("initiating");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/calls/outbound", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId: companyData.id,
          phoneNumber: phoneNumber,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to initiate call");
      }

      console.log("Call initiated:", result);
      setCallStatus("calling");

      // Auto-close dialog after showing success for a few seconds
      setTimeout(() => {
        setCallStatus("completed");
        setTimeout(() => {
          setDialogOpen(false);
          setCallStatus("idle");
        }, 2000);
      }, 3000);
    } catch (error) {
      console.error("Error initiating call:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to initiate call");
      setCallStatus("error");
    }
  };

  const handlePhoneNumberChange = (value: string) => {
    setPhoneNumber(value);
    setPhoneError(null);
  };

  const getStatusText = () => {
    switch (callStatus) {
      case "initiating":
        return "Initiating call...";
      case "calling":
        return "Call in progress";
      case "completed":
        return "Call initiated successfully";
      case "error":
        return "Error initiating call";
      default:
        return "";
    }
  };

  const getStatusIcon = () => {
    switch (callStatus) {
      case "initiating":
        return <Loader2 className="size-12 animate-spin text-primary" />;
      case "calling":
        return <Phone className="size-12 text-green-600 animate-pulse" />;
      case "completed":
        return <Phone className="size-12 text-green-600" />;
      case "error":
        return <PhoneOff className="size-12 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <>
      <Button size="sm" onClick={handleOpenDialog}>
        <Phone className="size-4" />
        Start Call
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="size-5" />
              Call {companyData.name}
            </DialogTitle>
            <DialogDescription>
              Enter the phone number to call (E.164 format)
            </DialogDescription>
          </DialogHeader>

          {callStatus === "idle" ? (
            <>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+13243244444"
                    value={phoneNumber}
                    onChange={(e) => handlePhoneNumberChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleInitiateCall();
                      }
                    }}
                    className={phoneError ? "border-red-500" : ""}
                  />
                  {phoneError && (
                    <p className="text-sm text-red-600">{phoneError}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Format: +[country code][number] (e.g., +13243244444 for US)
                  </p>
                </div>

                <div className="rounded-lg border bg-muted/50 p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Company:</span>
                      <span className="font-medium">{companyData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Industry:</span>
                      <span className="font-medium">{companyData.industry}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Geography:</span>
                      <span className="font-medium">{companyData.geography}</span>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInitiateCall} disabled={!phoneNumber}>
                  <Phone className="mr-2 size-4" />
                  Initiate Call
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="flex flex-col items-center gap-6 py-6">
              {getStatusIcon()}
              <div className="flex flex-col items-center gap-2">
                <p className="text-lg font-semibold">{getStatusText()}</p>
                {callStatus === "calling" && (
                  <p className="text-sm text-muted-foreground">
                    Calling {phoneNumber}...
                  </p>
                )}
                {errorMessage && callStatus === "error" && (
                  <p className="text-sm text-red-600">{errorMessage}</p>
                )}
              </div>

              {callStatus === "error" && (
                <Button
                  onClick={() => setCallStatus("idle")}
                  variant="outline"
                  className="w-full"
                >
                  Try Again
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
