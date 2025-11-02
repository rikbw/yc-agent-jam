import type { ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { CompanyLogo } from "@/components/company-logo";
import { CompanyCallSection } from "@/components/company-call-section";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { prisma } from "@/lib/prisma";
import { mapDbIndustryToType } from "@/lib/db-mappers";
import {
  DEAL_STAGE_COLORS,
  DEAL_STAGE_LABELS,
  type DealStage,
} from "@/types/seller";
import { notFound } from "next/navigation";
import {
  ExternalLink,
  Filter,
  Paperclip,
  UserPlus,
} from "lucide-react";

interface CompanyDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

const getInitials = (value: string) => {
  if (!value) return "";
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

const formatRelativeTime = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.round(diffMs / (1000 * 60));
  const absMinutes = Math.abs(minutes);
  const suffix = minutes >= 0 ? "ago" : "from now";

  if (absMinutes < 60) {
    const value = Math.max(absMinutes, 1);
    return `${value} minute${value === 1 ? "" : "s"} ${suffix}`;
  }

  const hours = Math.round(absMinutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ${suffix}`;
  }

  const days = Math.round(hours / 24);
  if (days < 7) {
    return `${days} day${days === 1 ? "" : "s"} ${suffix}`;
  }

  const weeks = Math.round(days / 7);
  if (weeks < 5) {
    return `${weeks} week${weeks === 1 ? "" : "s"} ${suffix}`;
  }

  const months = Math.round(days / 30);
  if (months < 12) {
    return `${months} month${months === 1 ? "" : "s"} ${suffix}`;
  }

  const years = Math.round(days / 365);
  const displayYears = Math.max(years, 1);
  return `${displayYears} year${displayYears === 1 ? "" : "s"} ${suffix}`;
};

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
    website: companyFromDb.website,
    valuation: companyFromDb.valuation,
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

  const lastContactRelative = formatRelativeTime(company.lastContactDate);
  const lastContactExact = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(company.lastContactDate);

  const emailThreads = [
    {
      id: "email-1",
      subject: "Thank you for your prompt action",
      sender: "Jordan Doe",
      senderEmail: "j.doe@" + company.name.toLowerCase().replace(/\s+/g, "") + ".com",
      timestamp: "5:30 PM",
      preview: `Hi ${company.ownerBankerName.split(" ")[0]}, thank you for your swift response regarding ${company.name}'s process. Looking forward to next steps.`,
      attachments: ["finance-overview.pdf"],
    },
    {
      id: "email-2",
      subject: "Your ticket to faraway flavors",
      sender: "Alex Smith",
      senderEmail: `alex.smith@${company.name.toLowerCase().replace(/\s+/g, "")}.com`,
      timestamp: "Aug 2",
      preview: `Sharing the latest campaign assets we discussed. Let me know how they look for your outreach.`,
      attachments: [],
    },
    {
      id: "email-3",
      subject: "Grab a plate",
      sender: "Nora Patel",
      senderEmail: "n.patel@" + company.name.toLowerCase().replace(/\s+/g, "") + ".com",
      timestamp: "Aug 1",
      preview: `Circling back on the product mix you requested. Added a quick summary below for your review.`,
      attachments: ["product-mix.xlsx"],
    },
    {
      id: "email-4",
      subject: "Summer Mondays",
      sender: "Alex Smith",
      senderEmail: `alex.smith@${company.name.toLowerCase().replace(/\s+/g, "")}.com`,
      timestamp: "Jul 16",
      preview: `Weekly digest with top-line metrics and notes from the Monday sync.`,
      attachments: [],
    },
    {
      id: "email-5",
      subject: "Steak + Caesar",
      sender: "Jordan Doe",
      senderEmail: "j.doe@" + company.name.toLowerCase().replace(/\s+/g, "") + ".com",
      timestamp: "Jul 9",
      preview: `Latest buyer sentiment and tasting notes attached. Highlighting a few quick wins below.`,
      attachments: ["tasting-notes.docx"],
    },
  ];

  const recordDetailRows: { label: string; value: ReactNode }[] = [
    {
      label: "Deal Stage",
      value: (
        <Badge
          className={`${DEAL_STAGE_COLORS[company.dealStage]} rounded-full px-2.5 py-0.5 text-xs font-medium`}
          variant="secondary"
        >
          {DEAL_STAGE_LABELS[company.dealStage]}
        </Badge>
      ),
    },
    { label: "Name", value: company.name },
    { label: "Industry", value: company.industry },
    { label: "Geography", value: company.geography },
    { label: "Revenue", value: formatCurrency(company.revenue) },
    { label: "EBITDA", value: formatCurrency(company.ebitda) },
    { label: "Headcount", value: company.headcount.toLocaleString() },
    { label: "Estimated Deal Size", value: formatCurrency(company.estimatedDealSize) },
    { label: "Likelihood to Sell", value: `${company.likelihoodToSell}%` },
    { label: "Owner", value: company.ownerBankerName },
    {
      label: "Last Contact",
      value: (
        <span className="flex flex-col">
          <span>{lastContactExact}</span>
          <span className="text-xs text-muted-foreground">{lastContactRelative}</span>
        </span>
      ),
    },
  ];

  if (company.website) {
    recordDetailRows.splice(2, 0, {
      label: "Website",
      value: (
        <a
          href={company.website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          {company.website.replace(/^https?:\/\//, "")}
          <ExternalLink className="size-3.5" />
        </a>
      ),
    });
  }

  if (company.valuation) {
    recordDetailRows.push({
      label: "Valuation",
      value: formatCurrency(company.valuation),
    });
  }

  const listAssignments = [
    {
      name: "Sales",
      stage: DEAL_STAGE_LABELS[company.dealStage],
      owner: company.ownerBankerName,
      updated: lastContactRelative,
    },
  ];

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

        <div className="flex flex-1 flex-col gap-8 px-6 py-6 lg:px-10">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem>
                        <BreadcrumbLink href="/seller-crm">Companies</BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage>{company.name}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <CompanyLogo
                    companyName={company.name}
                    className="h-14 w-14 rounded-full text-base"
                  />
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="text-3xl font-semibold tracking-tight">{company.name}</h1>
                      <Badge
                        className={`${DEAL_STAGE_COLORS[company.dealStage]} rounded-full px-3 py-1 text-xs font-medium`}
                        variant="secondary"
                      >
                        {DEAL_STAGE_LABELS[company.dealStage]}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Avatar className="size-8 border border-border/60">
                          <AvatarFallback>{getInitials(company.ownerBankerName)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">
                          {company.ownerBankerName}
                        </span>
                      </div>
                      <span className="hidden text-muted-foreground sm:inline">•</span>
                      <span>Last contact {lastContactRelative}</span>
                    </div>
                  </div>
                </div>
              </div>

              <CompanyCallSection companyData={company} />
            </div>
          </div>

          <div className="grid flex-1 gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
            <div className="flex min-h-[28rem] flex-col">
              <Tabs defaultValue="emails" className="flex h-full flex-col">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 pb-3">
                  <TabsList className="h-auto gap-3 rounded-none border-0 bg-transparent p-0">
                    <TabsTrigger
                      value="activity"
                      className="rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pb-2 shadow-none ring-0 ring-offset-0 data-[state=active]:border-primary"
                    >
                      Activity
                    </TabsTrigger>
                    <TabsTrigger
                      value="emails"
                      className="rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pb-2 shadow-none ring-0 ring-offset-0 data-[state=active]:border-primary"
                    >
                      Emails
                      <span className="ml-2 text-xs text-muted-foreground">
                        {emailThreads.length}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="team"
                      className="rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pb-2 shadow-none ring-0 ring-offset-0 data-[state=active]:border-primary"
                    >
                      Team
                      <span className="ml-2 text-xs text-muted-foreground">1</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="notes"
                      className="rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pb-2 shadow-none ring-0 ring-offset-0 data-[state=active]:border-primary"
                    >
                      Notes
                      <span className="ml-2 text-xs text-muted-foreground">0</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="tasks"
                      className="rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pb-2 shadow-none ring-0 ring-offset-0 data-[state=active]:border-primary"
                    >
                      Tasks
                      <span className="ml-2 text-xs text-muted-foreground">0</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="files"
                      className="rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pb-2 shadow-none ring-0 ring-offset-0 data-[state=active]:border-primary"
                    >
                      Files
                      <span className="ml-2 text-xs text-muted-foreground">0</span>
                    </TabsTrigger>
                  </TabsList>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="size-4" />
                      Filters
                    </Button>
                    <Button variant="outline" size="sm">
                      <UserPlus className="size-4" />
                      Manage access
                    </Button>
                  </div>
                </div>

                <TabsContent value="activity" className="flex flex-1 flex-col px-6 pb-6">
                  <div className="flex flex-1 items-center justify-center bg-muted/10 text-sm text-muted-foreground">
                    Activity feed coming soon.
                  </div>
                </TabsContent>

                <TabsContent value="emails" className="flex flex-1 flex-col">
                  <div className="border-b px-6 py-4 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {company.ownerBankerName}
                    </span>{" "}
                    updated this record {lastContactRelative}
                  </div>
                  <div className="flex-1 overflow-auto">
                    <div className="divide-y">
                      {emailThreads.map((email) => (
                        <article
                          key={email.id}
                          className="flex flex-col gap-3 px-6 py-4 transition hover:bg-muted/60"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="size-9">
                                <AvatarFallback>{getInitials(email.sender)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                  <span>{email.sender}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {email.senderEmail}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground">{email.timestamp}</div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 pl-12">
                            <div className="text-base font-semibold text-foreground">
                              {email.subject}
                            </div>
                            <p className="text-sm leading-relaxed text-muted-foreground">
                              {email.preview}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              {email.attachments.map((attachment) => (
                                <Badge
                                  key={attachment}
                                  variant="secondary"
                                  className="flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-xs font-medium text-foreground"
                                >
                                  <Paperclip className="size-3.5" />
                                  {attachment}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="team" className="flex flex-1 flex-col px-6 pb-6">
                  <div className="flex flex-col gap-4 py-6">
                    <div className="flex items-center gap-3 bg-muted/40 p-4">
                      <Avatar className="size-10">
                        <AvatarFallback>{getInitials(company.ownerBankerName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {company.ownerBankerName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Relationship owner • Added {lastContactRelative}
                        </div>
                      </div>
                    </div>
                    <div className="py-10 text-center text-sm text-muted-foreground">
                      Add more collaborators to keep everyone in sync.
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="flex flex-1 flex-col px-6 pb-6">
                  <div className="flex flex-1 items-center justify-center bg-muted/10 text-sm text-muted-foreground">
                    No notes yet. Start capturing key learnings from calls or meetings.
                  </div>
                </TabsContent>

                <TabsContent value="tasks" className="flex flex-1 flex-col px-6 pb-6">
                  <div className="flex flex-1 items-center justify-center bg-muted/10 text-sm text-muted-foreground">
                    Tasks help your team stay aligned. Create one to get started.
                  </div>
                </TabsContent>

                <TabsContent value="files" className="flex flex-1 flex-col px-6 pb-6">
                  <div className="flex flex-1 items-center justify-center bg-muted/10 text-sm text-muted-foreground">
                    File management coming soon.
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="flex min-h-[28rem] flex-col">
              <Tabs defaultValue="details" className="flex h-full flex-col">
                <div className="border-b px-6 pb-3">
                  <TabsList className="h-auto gap-3 rounded-none border-0 bg-transparent p-0">
                    <TabsTrigger
                      value="details"
                      className="rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pb-2 shadow-none ring-0 ring-offset-0 data-[state=active]:border-primary"
                    >
                      Details
                    </TabsTrigger>
                    <TabsTrigger
                      value="comments"
                      className="rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pb-2 shadow-none ring-0 ring-offset-0 data-[state=active]:border-primary"
                    >
                      Comments
                      <span className="ml-2 text-xs text-muted-foreground">0</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="details" className="flex flex-1 flex-col gap-6 px-6 py-5">
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">Record Details</h3>
                      <Button variant="ghost" size="sm" className="h-auto px-2 text-xs text-muted-foreground">
                        Show all values
                      </Button>
                    </div>
                    <dl className="grid gap-4">
                      {recordDetailRows.map((row) => (
                        <div key={row.label} className="flex flex-col gap-1">
                          <dt className="text-xs font-medium uppercase text-muted-foreground">
                            {row.label}
                          </dt>
                          <dd className="text-sm text-foreground">{row.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>

                  <Separator />

                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">Lists</h3>
                      <Button variant="ghost" size="sm" className="h-auto px-2 text-xs text-muted-foreground">
                        Add to list
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {listAssignments.map((list, index) => (
                        <div key={list.name}>
                          {index > 0 && <Separator className="mb-3" />}
                          <div className="space-y-3">
                            <div className="text-sm font-semibold text-foreground">{list.name}</div>
                            <div className="grid gap-3">
                              <div className="flex flex-col gap-1">
                                <span className="text-xs uppercase text-muted-foreground">Stage</span>
                                <div className="text-sm font-medium text-foreground">{list.stage}</div>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-xs uppercase text-muted-foreground">Owner</span>
                                <div className="text-sm font-medium text-foreground">{list.owner}</div>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-xs uppercase text-muted-foreground">Updated</span>
                                <div className="text-sm text-foreground">{list.updated}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <Separator />

                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">Categories</h3>
                      <Button variant="ghost" size="sm" className="h-auto px-2 text-xs text-muted-foreground">
                        Manage
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
                        {company.industry}
                      </Badge>
                      <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
                        {company.geography}
                      </Badge>
                      <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
                        High intent
                      </Badge>
                    </div>
                  </section>
                </TabsContent>

                <TabsContent value="comments" className="flex flex-1 flex-col px-6 pb-6">
                  <div className="flex flex-1 items-center justify-center bg-muted/10 px-6 text-center text-sm text-muted-foreground">
                    Keep teammates in the loop with comments. Mention someone to notify them instantly.
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
