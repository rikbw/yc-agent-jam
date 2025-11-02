"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";
import { searchAndSyncOrganizations } from "@/app/campaigns/actions";
import { useRouter } from "next/navigation";

interface RefreshCompaniesButtonProps {
  campaignId: string;
}

export function RefreshCompaniesButton({ campaignId }: RefreshCompaniesButtonProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ count: number; total: number } | null>(null);

  async function handleRefresh() {
    setIsRefreshing(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await searchAndSyncOrganizations(campaignId);
      setSuccess({ count: result.count, total: result.total });
      router.refresh();
    } catch (err) {
      console.error("Error refreshing companies:", err);
      setError(err instanceof Error ? err.message : "Failed to refresh companies");
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={handleRefresh}
        disabled={isRefreshing}
        variant="outline"
      >
        {isRefreshing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="mr-2 h-4 w-4" />
        )}
        {isRefreshing ? "Refreshing..." : "Refresh Companies"}
      </Button>

      {success && (
        <div className="text-sm text-green-600">
          Synced {success.count} of {success.total} companies
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
