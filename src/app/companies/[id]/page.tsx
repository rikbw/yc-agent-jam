import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { CompanyLogo } from "@/components/company-logo";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { mapDbIndustryToType } from "@/lib/db-mappers";
import { DEAL_STAGE_LABELS, DEAL_STAGE_COLORS, type DealStage } from "@/types/seller";
import { notFound } from "next/navigation";

interface CompanyDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CompanyDetailPage({ params }: CompanyDetailPageProps) {
  const { id } = await params;

  const companyFromDb = await prisma.sellerCompany.findUnique({
    where: { id },
    include: {
      ownerBanker: true,
    },
  });

  if (!companyFromDb) {
    notFound();
  }

  const company = {
    id: companyFromDb.id,
    name: companyFromDb.name,
    industry: mapDbIndustryToType(companyFromDb.industry),
    revenue: companyFromDb.revenue,
    ebitda: companyFromDb.ebitda,
    headcount: companyFromDb.headcount,
    geography: companyFromDb.geography,
    dealStage: companyFromDb.dealStage as DealStage,
    ownerBankerId: companyFromDb.ownerBankerId,
    ownerBankerName: companyFromDb.ownerBanker.name,
    lastContactDate: companyFromDb.lastContactDate,
    estimatedDealSize: companyFromDb.estimatedDealSize,
    likelihoodToSell: companyFromDb.likelihoodToSell,
    createdAt: companyFromDb.createdAt,
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

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
                <BreadcrumbLink href="/seller-crm">Seller CRM</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{company.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Company Header */}
          <div className="flex items-center gap-4">
            <CompanyLogo companyName={company.name} className="h-12 w-12 text-base" />
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight">{company.name}</h1>
              <p className="text-muted-foreground">
                {company.industry} • {company.geography}
              </p>
            </div>
            <Badge className={DEAL_STAGE_COLORS[company.dealStage]} variant="secondary">
              {DEAL_STAGE_LABELS[company.dealStage]}
            </Badge>
          </div>

          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(company.revenue)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">EBITDA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(company.ebitda)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Est. Deal Size</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(company.estimatedDealSize)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Headcount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{company.headcount}</div>
              </CardContent>
            </Card>
          </div>

          {/* Details Sections */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>Basic company details and classification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Industry</div>
                  <div className="text-base">{company.industry}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Geography</div>
                  <div className="text-base">{company.geography}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Likelihood to Sell</div>
                  <div className="text-base">{company.likelihoodToSell}%</div>
                </div>
              </CardContent>
            </Card>

            {/* Deal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Deal Information</CardTitle>
                <CardDescription>Current deal status and ownership</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Deal Stage</div>
                  <div className="text-base">{DEAL_STAGE_LABELS[company.dealStage]}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Owner</div>
                  <div className="text-base">{company.ownerBankerName}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Last Contact</div>
                  <div className="text-base">
                    {company.lastContactDate.toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Placeholder Sections */}
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
                <CardDescription>Recent interactions and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  Activity timeline coming soon...
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
                <CardDescription>Company documents and materials</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  Document management coming soon...
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
