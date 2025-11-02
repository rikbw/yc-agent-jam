import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "./columns";
import { prisma } from "@/lib/prisma";
import type { Campaign } from "./columns";
import { NewCampaignButton } from "@/components/campaigns/new-campaign-button";

export default async function CampaignsPage() {
  const campaignsFromDb = await prisma.campaign.findMany({
    include: {
      _count: {
        select: { sellers: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const campaigns: Campaign[] = campaignsFromDb.map((campaign) => ({
    id: campaign.id,
    name: campaign.name,
    description: campaign.description,
    sellerCount: campaign._count.sellers,
    createdAt: campaign.createdAt,
    updatedAt: campaign.updatedAt,
  }));

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
                <BreadcrumbPage>Campaigns</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
              <p className="text-muted-foreground">
                Organize your seller outreach into targeted campaigns.
              </p>
            </div>
            <NewCampaignButton />
          </div>
          <DataTable
            columns={columns}
            data={campaigns}
            searchKey="name"
            searchPlaceholder="Search campaigns..."
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
