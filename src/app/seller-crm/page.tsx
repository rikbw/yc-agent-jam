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
import { columns } from "./columns";
import { prisma } from "@/lib/prisma";
import { mapDbIndustryToType } from "@/lib/db-mappers";
import type { SellerCompany, DealStage } from "@/types/seller";

export default async function SellerCRMPage() {
  const sellersFromDb = await prisma.sellerCompany.findMany({
    include: {
      ownerBanker: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const sellers: SellerCompany[] = sellersFromDb.map((seller) => ({
    id: seller.id,
    name: seller.name,
    industry: mapDbIndustryToType(seller.industry),
    revenue: seller.revenue,
    ebitda: seller.ebitda,
    headcount: seller.headcount,
    geography: seller.geography,
    dealStage: seller.dealStage as DealStage,
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
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">Deal Sourcing</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Seller CRM</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Seller CRM</h1>
              <p className="text-muted-foreground">
                Manage your pipeline of potential sellers and track deal progress.
              </p>
            </div>
          </div>
          <DataTable
            columns={columns}
            data={sellers}
            searchKey="name"
            searchPlaceholder="Search companies..."
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
