import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { columns } from "@/app/seller-crm/columns";
import { SellerCompany } from "@/types/seller";

interface CampaignPageProps {
  params: {
    id: string;
  };
}

export default async function CampaignPage({ params }: CampaignPageProps) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: params.id },
    include: {
      sellers: {
        include: {
          ownerBanker: true,
          campaign: true,
        },
        orderBy: {
          lastContactDate: "desc",
        },
      },
    },
  });

  if (!campaign) {
    notFound();
  }

  const sellers: SellerCompany[] = campaign.sellers.map((seller) => ({
    id: seller.id,
    companyName: seller.companyName,
    industry: seller.industry,
    revenue: seller.revenue,
    ebitda: seller.ebitda,
    dealStage: seller.dealStage,
    ownerBankerId: seller.ownerBankerId ?? undefined,
    ownerBankerName: seller.ownerBanker?.name,
    lastContactDate: seller.lastContactDate,
    createdAt: seller.createdAt,
    updatedAt: seller.updatedAt,
    campaignId: seller.campaignId ?? undefined,
    campaignName: seller.campaign?.name,
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
                <BreadcrumbLink href="/campaigns">Campaigns</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{campaign.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{campaign.name}</h1>
            {campaign.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {campaign.description}
              </p>
            )}
          </div>

          {campaign.searchParams && (
            <Card>
              <CardHeader>
                <CardTitle>Search Parameters</CardTitle>
                <CardDescription>
                  Target criteria for this campaign
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-xs font-mono bg-muted p-4 rounded-md overflow-x-auto">
                  {JSON.stringify(campaign.searchParams, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          <div>
            <h2 className="text-lg font-semibold mb-3">
              Companies ({sellers.length})
            </h2>
            <DataTable columns={columns} data={sellers} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
