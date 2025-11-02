"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { createCampaign } from "../actions";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function NewCampaignPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [params, setParams] = useState("");

  useEffect(() => {
    const name = searchParams.get("name");
    const description = searchParams.get("description");
    const paramsJson = searchParams.get("params");

    if (!name || !paramsJson) {
      router.push("/campaigns");
      return;
    }

    try {
      const parsed = JSON.parse(paramsJson);
      setParams(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.error("Failed to parse params:", e);
      router.push("/campaigns");
    }
  }, [searchParams, router]);

  async function handleCreateCampaign() {
    setIsCreating(true);
    try {
      const name = searchParams.get("name")!;
      const description = searchParams.get("description") || "";
      const parsedParams = JSON.parse(params);

      await createCampaign(name, description, parsedParams);
      router.push("/campaigns");
    } catch (error) {
      console.error("Failed to create campaign:", error);
      alert("Failed to create campaign. Please check the parameters and try again.");
    } finally {
      setIsCreating(false);
    }
  }

  const name = searchParams.get("name") || "";
  const description = searchParams.get("description") || "";

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/campaigns">Campaigns</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Review Parameters</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              disabled={isCreating}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Review Campaign Parameters</h1>
              <p className="text-sm text-muted-foreground">
                Review and adjust the generated search parameters before creating the campaign.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold mb-1">Campaign Name</h3>
              <p className="text-sm text-muted-foreground">{name}</p>
            </div>
            {description && (
              <div>
                <h3 className="text-sm font-semibold mb-1">Description</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">Search Parameters</h3>
            <Textarea
              value={params}
              onChange={(e) => setParams(e.target.value)}
              className="font-mono text-xs min-h-[400px]"
              placeholder="Search parameters in JSON format..."
              disabled={isCreating}
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Edit the JSON above to adjust search parameters. Make sure the JSON is valid.
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCampaign}
              disabled={isCreating}
            >
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isCreating ? "Creating Campaign..." : "Create Campaign"}
            </Button>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
