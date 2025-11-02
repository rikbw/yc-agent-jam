"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2, Sparkles } from "lucide-react";
import { generateCampaignParams } from "@/app/campaigns/actions";

export function NewCampaignButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData(event.currentTarget);
      const name = formData.get("name") as string;
      const description = formData.get("description") as string;

      if (!name) {
        setError("Campaign name is required");
        return;
      }

      // Generate campaign parameters using LLM
      const result = await generateCampaignParams(name, description);

      if (result.success) {
        // Navigate to review page with params
        const params = new URLSearchParams({
          name,
          description: description || "",
          params: JSON.stringify(result.params),
        });
        router.push(`/campaigns/new?${params.toString()}`);
        setOpen(false);
        event.currentTarget.reset();
      }
    } catch (error) {
      console.error("Failed to generate campaign params:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to generate campaign parameters. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Campaign
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
            <DialogDescription>
              Describe your campaign and we'll generate targeted search parameters using AI.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Campaign Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Q1 2024 Tech Companies"
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Campaign Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Targeting mid-market SaaS companies in the Bay Area with 50-200 employees and $5-20M in revenue..."
                rows={4}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Describe your target companies. Include details like industry, size, location, revenue, etc.
              </p>
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Parameters...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Campaign
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
