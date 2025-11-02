import "dotenv/config";
import { PrismaClient, DealStage, Industry, CallOutcome, MessageRole } from "../../src/generated/prisma/client";

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

const callOutcomes = [
  CallOutcome.productive,
  CallOutcome.no_answer,
  CallOutcome.voicemail,
  CallOutcome.scheduled_meeting,
  CallOutcome.not_interested,
];

const sampleConversations = [
  {
    messages: [
      { role: MessageRole.assistant, text: "Hello, this is {banker} from the investment bank. I wanted to discuss potential opportunities for {company}." },
      { role: MessageRole.user, text: "Hi, thanks for reaching out. What kind of opportunities are you referring to?" },
      { role: MessageRole.assistant, text: "We specialize in M&A advisory and have seen strong buyer interest in the {industry} sector. I'd like to understand if you've considered an exit strategy." },
      { role: MessageRole.user, text: "We haven't actively pursued it, but we're open to conversations. What would be the next steps?" },
      { role: MessageRole.assistant, text: "Great! I'd suggest we schedule a more detailed call to discuss your business metrics and explore potential valuations." },
    ]
  },
  {
    messages: [
      { role: MessageRole.assistant, text: "Good morning, I'm calling to follow up on our previous conversation about {company}." },
      { role: MessageRole.user, text: "Yes, I remember. We've been thinking about it." },
      { role: MessageRole.assistant, text: "Excellent. Have you had a chance to review the market analysis I sent over?" },
      { role: MessageRole.user, text: "I did, and it's quite interesting. The multiples you mentioned are higher than I expected." },
      { role: MessageRole.assistant, text: "The market is very favorable right now. Would you be available next week to discuss this in more detail with our team?" },
      { role: MessageRole.user, text: "Yes, let's set something up." },
    ]
  },
  {
    messages: [
      { role: MessageRole.assistant, text: "Hi, I wanted to touch base about the proposal we sent last week." },
      { role: MessageRole.user, text: "I've been reviewing it with my co-founders. We have some questions about the timeline." },
      { role: MessageRole.assistant, text: "Of course, I'm happy to address any questions. What specific concerns do you have about the timeline?" },
      { role: MessageRole.user, text: "The due diligence period seems quite short. We're worried about disrupting operations." },
      { role: MessageRole.assistant, text: "That's a valid concern. We can certainly be flexible on the timeline to ensure minimal disruption. Let me propose a revised schedule." },
    ]
  },
  {
    messages: [
      { role: MessageRole.assistant, text: "This is {banker} calling about our M&A services. Is now a good time?" },
      { role: MessageRole.user, text: "Actually, we're not interested in selling at the moment." },
      { role: MessageRole.assistant, text: "I understand. May I ask what your long-term plans are for the business?" },
      { role: MessageRole.user, text: "We're focused on growth right now and aren't considering an exit." },
      { role: MessageRole.assistant, text: "That makes sense. Would it be okay if I checked back in 6 months to see if anything has changed?" },
    ]
  },
];

const activeDealStages: Set<DealStage> = new Set([
  DealStage.pitch_meeting_planned,
  DealStage.proposal_sent,
  DealStage.mandate_signed,
  DealStage.deal_material_creation,
  DealStage.buyer_reachouts,
  DealStage.deal_negotiations,
]);

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
    await prisma.message.deleteMany();
    await prisma.call.deleteMany();
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
  const createdCompanies: Array<{ id: string; name: string; industry: string; ownerBankerId: string; ownerBankerName: string }> = [];

  for (let i = 0; i < count; i++) {
    const revenue = randomNumber(500_000, 50_000_000);
    const ebitdaMargin = randomNumber(10, 35) / 100;
    const ebitda = Math.floor(revenue * ebitdaMargin);
    const banker = randomElement(bankers);
    const dealStage = randomElement(dealStages);

    // More recent contact for active deals
    const isActiveDeal = activeDealStages.has(dealStage);

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

    const industry = randomElement(industries);
    const company = await prisma.sellerCompany.create({
      data: {
        name: companyName,
        industry,
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

    createdCompanies.push({
      id: company.id,
      name: company.name,
      industry: industry,
      ownerBankerId: banker.id,
      ownerBankerName: banker.name,
    });
  }
  console.log(`✅ Created ${count} seller companies`);

  // Create calls and messages for each company
  console.log("📞 Creating calls and messages...");
  let totalCalls = 0;
  let totalMessages = 0;

  for (const company of createdCompanies) {
    const callCount = randomNumber(2, 5);

    for (let i = 0; i < callCount; i++) {
      const outcome = randomElement(callOutcomes);
      const conversation = randomElement(sampleConversations);
      const callDate = randomDate(90);
      const duration = randomNumber(5, 45);

      // Create the call
      const call = await prisma.call.create({
        data: {
          sellerCompanyId: company.id,
          bankerId: company.ownerBankerId,
          callDate,
          duration,
          outcome,
          notes: outcome === CallOutcome.scheduled_meeting
            ? "Follow-up meeting scheduled for next week"
            : outcome === CallOutcome.productive
            ? "Positive conversation, showing interest in exploring options"
            : outcome === CallOutcome.not_interested
            ? "Not interested at this time, revisit in 6 months"
            : outcome === CallOutcome.voicemail
            ? "Left voicemail with callback details"
            : "No answer, will try again later",
        },
      });

      totalCalls++;

      // Create messages for this call
      if (outcome === CallOutcome.productive || outcome === CallOutcome.scheduled_meeting) {
        // For productive calls, create a full conversation
        let messageTime = new Date(callDate);

        for (const msg of conversation.messages) {
          const transcript = msg.text
            .replace('{banker}', company.ownerBankerName)
            .replace('{company}', company.name)
            .replace('{industry}', company.industry);

          await prisma.message.create({
            data: {
              callId: call.id,
              role: msg.role,
              transcript,
              timestamp: new Date(messageTime),
            },
          });

          totalMessages++;
          // Add 10-30 seconds between messages
          messageTime = new Date(messageTime.getTime() + randomNumber(10, 30) * 1000);
        }
      } else if (outcome === CallOutcome.no_answer) {
        // For no answer, just the initial greeting
        await prisma.message.create({
          data: {
            callId: call.id,
            role: MessageRole.assistant,
            transcript: `Hello, this is ${company.ownerBankerName} calling for ${company.name}. Please give me a call back at your earliest convenience.`,
            timestamp: callDate,
          },
        });
        totalMessages++;
      } else if (outcome === CallOutcome.voicemail) {
        // For voicemail, leave a message
        await prisma.message.create({
          data: {
            callId: call.id,
            role: MessageRole.assistant,
            transcript: `Hi, this is ${company.ownerBankerName} from the investment bank. I wanted to discuss some M&A opportunities for ${company.name}. Please call me back when you have a moment.`,
            timestamp: callDate,
          },
        });
        totalMessages++;
      }
    }
  }

  console.log(`✅ Created ${totalCalls} calls with ${totalMessages} messages`);

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
