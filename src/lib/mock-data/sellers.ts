import type { SellerCompany, DealStage, Industry } from "@/types/seller";

const companyNames = [
  "TechFlow Solutions",
  "Artisan Coffee Roasters",
  "MedTech Innovations",
  "LogiChain Pro",
  "GreenEnergy Systems",
  "FinanceHub",
  "CloudSync Technologies",
  "Premium Food Distributors",
  "DataSecure Systems",
  "Urban Real Estate Group",
  "HealthCare Plus",
  "Manufacturing Excellence",
  "E-Shop Masters",
  "ConsultPro Services",
  "Digital Marketing Hub",
  "AutoParts Wholesale",
  "FreshMart Supermarkets",
  "BuildTech Construction",
  "PharmaSolutions",
  "TravelEase Booking",
  "SportGear Retail",
  "EduTech Learning",
  "Fashion Forward",
  "HomeDecor Specialists",
  "AgriTech Farming",
  "SecureBank Systems",
  "CleanTech Solutions",
  "PackageLogistics",
  "LegalEase Software",
  "DesignStudio Pro",
  "CloudHosting Services",
  "RetailPOS Systems",
  "SmartHome Tech",
  "FoodDelivery Network",
  "InsureTech Solutions",
  "MarketPlace Platform",
  "VideoStream Services",
  "CyberDefense Systems",
  "HRManage Software",
  "AccountingPro Tools",
  "ProjectTrack Solutions",
  "CustomerCRM Plus",
  "InventoryMaster",
  "PaymentGateway Pro",
  "Analytics Dashboard",
  "MobilePay Solutions",
  "WorkSpace Rentals",
  "FitnessTrack App",
  "RecipeBox Platform",
  "PetCare Services",
  "EventPlan Pro",
  "TranslateAI Services",
  "AudioStream Platform",
  "GraphicDesign Tools",
  "CodeDeploy Systems",
];

const bankers = [
  { id: "banker-1", name: "Sarah Johnson" },
  { id: "banker-2", name: "Michael Chen" },
  { id: "banker-3", name: "Emma Williams" },
  { id: "banker-4", name: "David Rodriguez" },
  { id: "banker-5", name: "Lisa Anderson" },
  { id: "banker-6", name: "James Thompson" },
];

const industries: Industry[] = [
  "SaaS",
  "E-commerce",
  "Manufacturing",
  "Healthcare",
  "Fintech",
  "Food & Beverage",
  "Professional Services",
  "Technology",
  "Logistics",
  "Real Estate",
];

const dealStages: DealStage[] = [
  "automated_outreach",
  "dealer_outreach",
  "pitch_meeting_planned",
  "proposal_sent",
  "mandate_signed",
  "deal_material_creation",
  "buyer_reachouts",
  "deal_negotiations",
  "deal_closed",
  "deal_lost",
  "re_engage_later",
];

const geographies = [
  "Belgium",
  "Netherlands",
  "Germany",
  "France",
  "Luxembourg",
  "Switzerland",
  "Austria",
  "UK",
];

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - randomNumber(1, daysAgo));
  return date;
}

export function generateMockSellers(count: number = 55): SellerCompany[] {
  const sellers: SellerCompany[] = [];

  for (let i = 0; i < count; i++) {
    const revenue = randomNumber(500_000, 50_000_000);
    const ebitdaMargin = randomNumber(10, 35) / 100;
    const ebitda = Math.floor(revenue * ebitdaMargin);
    const banker = randomElement(bankers);
    const dealStage = randomElement(dealStages);

    // More recent contact for active deals
    const isActiveDeal = [
      "pitch_meeting_planned",
      "proposal_sent",
      "mandate_signed",
      "deal_material_creation",
      "buyer_reachouts",
      "deal_negotiations",
    ].includes(dealStage);

    const lastContactDaysAgo = isActiveDeal
      ? randomNumber(1, 14)
      : randomNumber(15, 120);

    sellers.push({
      id: `seller-${i + 1}`,
      name: companyNames[i % companyNames.length],
      industry: randomElement(industries),
      revenue,
      ebitda,
      headcount: randomNumber(5, 500),
      geography: randomElement(geographies),
      dealStage,
      ownerBankerId: banker.id,
      ownerBankerName: banker.name,
      lastContactDate: randomDate(lastContactDaysAgo),
      estimatedDealSize: Math.floor(revenue * randomNumber(50, 150) / 100),
      likelihoodToSell: randomNumber(20, 95),
      createdAt: randomDate(randomNumber(30, 365)),
    });
  }

  return sellers;
}

export const mockSellers = generateMockSellers();
