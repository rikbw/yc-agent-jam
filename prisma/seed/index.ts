import "dotenv/config";
import { PrismaClient } from "../../src/generated/prisma/client";
import { DealStage, Industry } from "../../src/generated/prisma/enums";

const prisma = new PrismaClient();

const bankers = [
  { id: "banker-1", name: "Sarah Johnson" },
  { id: "banker-2", name: "Michael Chen" },
  { id: "banker-3", name: "Emma Williams" },
  { id: "banker-4", name: "David Rodriguez" },
  { id: "banker-5", name: "Lisa Anderson" },
  { id: "banker-6", name: "James Thompson" },
];

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

const industries = [
  Industry.SaaS,
  Industry.E_commerce,
  Industry.Manufacturing,
  Industry.Healthcare,
  Industry.Fintech,
  Industry.Food_Beverage,
  Industry.Professional_Services,
  Industry.Technology,
  Industry.Logistics,
  Industry.Real_Estate,
];

const dealStages = [
  DealStage.automated_outreach,
  DealStage.dealer_outreach,
  DealStage.pitch_meeting_planned,
  DealStage.proposal_sent,
  DealStage.mandate_signed,
  DealStage.deal_material_creation,
  DealStage.buyer_reachouts,
  DealStage.deal_negotiations,
  DealStage.deal_closed,
  DealStage.deal_lost,
  DealStage.re_engage_later,
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

async function seed() {
  console.log("🌱 Starting database seed...");

  // Clear existing data (skip if tables don't exist yet)
  console.log("🧹 Clearing existing data...");
  try {
    await prisma.sellerCompany.deleteMany();
    await prisma.banker.deleteMany();
  } catch (error) {
    console.log("⚠️  Tables don't exist yet, skipping cleanup");
  }

  // Create bankers
  console.log("👨‍💼 Creating bankers...");
  for (const banker of bankers) {
    await prisma.banker.create({
      data: {
        id: banker.id,
        name: banker.name,
      },
    });
  }
  console.log(`✅ Created ${bankers.length} bankers`);

  // Create seller companies
  console.log("🏢 Creating seller companies...");
  const count = 55;
  for (let i = 0; i < count; i++) {
    const revenue = randomNumber(500_000, 50_000_000);
    const ebitdaMargin = randomNumber(10, 35) / 100;
    const ebitda = Math.floor(revenue * ebitdaMargin);
    const banker = randomElement(bankers);
    const dealStage = randomElement(dealStages);

    // More recent contact for active deals
    const isActiveDeal = [
      DealStage.pitch_meeting_planned,
      DealStage.proposal_sent,
      DealStage.mandate_signed,
      DealStage.deal_material_creation,
      DealStage.buyer_reachouts,
      DealStage.deal_negotiations,
    ].includes(dealStage);

    const lastContactDaysAgo = isActiveDeal
      ? randomNumber(1, 14)
      : randomNumber(15, 120);

    // Generate website for 70% of companies
    const hasWebsite = Math.random() > 0.3;
    const companyName = companyNames[i % companyNames.length];
    const website = hasWebsite
      ? `https://${companyName.toLowerCase().replace(/\s+/g, "")}.com`
      : undefined;

    // Generate valuation for 40% of companies (usually more advanced stage)
    const hasValuation = Math.random() > 0.6 || isActiveDeal;
    const valuation = hasValuation
      ? Math.floor(revenue * randomNumber(3, 12))
      : undefined;

    await prisma.sellerCompany.create({
      data: {
        name: companyName,
        industry: randomElement(industries),
        revenue,
        ebitda,
        headcount: randomNumber(5, 500),
        geography: randomElement(geographies),
        dealStage,
        ownerBankerId: banker.id,
        lastContactDate: randomDate(lastContactDaysAgo),
        estimatedDealSize: Math.floor((revenue * randomNumber(50, 150)) / 100),
        likelihoodToSell: randomNumber(20, 95),
        website,
        valuation,
        createdAt: randomDate(randomNumber(30, 365)),
      },
    });
  }
  console.log(`✅ Created ${count} seller companies`);

  console.log("✨ Seed completed successfully!");
}

seed()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
