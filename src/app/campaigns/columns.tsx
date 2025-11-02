"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

export type Campaign = {
  id: string;
  name: string;
  description: string | null;
  sellerCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export const columns: ColumnDef<Campaign>[] = [
  {
    accessorKey: "name",
    header: "Campaign Name",
    cell: ({ row }) => {
      const campaign = row.original;
      return (
        <Link
          href={`/campaigns/${campaign.id}`}
          className="font-medium hover:underline"
        >
          {row.getValue("name")}
        </Link>
      );
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const description = row.getValue("description") as string | null;
      return (
        <div className="max-w-md truncate text-muted-foreground">
          {description || "—"}
        </div>
      );
    },
  },
  {
    accessorKey: "sellerCount",
    header: "Companies",
    cell: ({ row }) => {
      const count = row.getValue("sellerCount") as number;
      return (
        <Badge variant="secondary">
          {count} {count === 1 ? "company" : "companies"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as Date;
      return (
        <div className="text-sm text-muted-foreground">
          {formatDistanceToNow(date, { addSuffix: true })}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const campaign = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(campaign.id)}
            >
              Copy campaign ID
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/campaigns/${campaign.id}`}>View details</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Edit campaign</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
