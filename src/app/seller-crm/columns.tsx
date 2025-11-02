"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header";
import { CompanyLogo } from "@/components/company-logo";
import {
  SellerCompany,
  DEAL_STAGE_LABELS,
  DEAL_STAGE_COLORS,
} from "@/types/seller";

export const columns: ColumnDef<SellerCompany>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Company" />
    ),
    cell: ({ row }) => {
      const company = row.original;
      return (
        <Link
          href={`/companies/${company.id}`}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <CompanyLogo companyName={company.name} className="h-6 w-6" />
          <span className="max-w-[500px] truncate font-medium">
            {row.getValue("name")}
          </span>
        </Link>
      );
    },
  },
  {
    accessorKey: "industry",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Industry" />
    ),
    cell: ({ row }) => {
      return (
        <Badge variant="outline" className="font-normal">
          {row.getValue("industry")}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "campaignName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Campaign" />
    ),
    cell: ({ row }) => {
      const campaignName = row.getValue("campaignName") as string | undefined;
      return (
        <div className="text-sm text-muted-foreground">
          {campaignName || "—"}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "revenue",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Revenue" />
    ),
    cell: ({ row }) => {
      const revenue = row.getValue("revenue") as number;
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(revenue);

      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "ebitda",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="EBITDA" />
    ),
    cell: ({ row }) => {
      const ebitda = row.getValue("ebitda") as number;
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(ebitda);

      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "dealStage",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Deal Stage" />
    ),
    cell: ({ row }) => {
      const stage = row.getValue("dealStage") as keyof typeof DEAL_STAGE_LABELS;
      const label = DEAL_STAGE_LABELS[stage];
      const colorClass = DEAL_STAGE_COLORS[stage];

      return (
        <Badge className={colorClass} variant="secondary">
          {label}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "ownerBankerName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Owner" />
    ),
    cell: ({ row }) => {
      return <div>{row.getValue("ownerBankerName")}</div>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "lastContactDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last Contact" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("lastContactDate") as Date;
      return (
        <div className="text-muted-foreground">
          {formatDistanceToNow(date, { addSuffix: true })}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const company = row.original;

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
              onClick={() => navigator.clipboard.writeText(company.id)}
            >
              Copy company ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem>Edit company</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
