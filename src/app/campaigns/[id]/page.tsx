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
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/app/seller-crm/columns";
import { mapDbIndustryToType } from "@/lib/db-mappers";
import type { SellerCompany, DealStage } from "@/types/seller";
import { RefreshCompaniesButton } from "@/components/campaigns/refresh-companies-button";
import { SearchParamsSection } from "@/components/campaigns/search-params-section";

interface CampaignPageProps {
  params: {
    id: string;
  };
}

export default async function CampaignPage({ params }: CampaignPageProps) {
  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
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
    name: seller.name,
    industry: mapDbIndustryToType(seller.industry),
    revenue: seller.revenue,
    ebitda: seller.ebitda,
    headcount: seller.headcount,
    geography: seller.geography,
    dealStage: seller.dealStage as DealStage,
    campaignId: seller.campaignId ?? undefined,
    campaignName: seller.campaign?.name,
    ownerBankerId: seller.ownerBankerId,
    ownerBankerName: seller.ownerBanker.name,
    lastContactDate: seller.lastContactDate,
    estimatedDealSize: seller.estimatedDealSize,
    likelihoodToSell: seller.likelihoodToSell,
    createdAt: seller.createdAt,
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
            <SearchParamsSection searchParams={campaign.searchParams} />
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">
                Companies ({sellers.length})
              </h2>
              <RefreshCompaniesButton campaignId={campaign.id} />
            </div>
            <DataTable
              columns={columns}
              data={sellers}
              searchKey="name"
              searchPlaceholder="Search companies..."
            />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
