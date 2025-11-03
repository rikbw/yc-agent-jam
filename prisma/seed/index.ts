import "dotenv/config";
import { PrismaClient, DealStage, Industry, CallOutcome, MessageRole, ActionType, ActionStatus, Campaign } from "../../src/generated/prisma/client";

const prisma = new PrismaClient();

const bankers = [
  { id: "banker-1", name: "Sarah Johnson" },
  { id: "banker-2", name: "Michael Chen" },
  { id: "banker-3", name: "Emma Williams" },
  { id: "banker-4", name: "David Rodriguez" },
  { id: "banker-5", name: "Lisa Anderson" },
  { id: "banker-6", name: "James Thompson" },
];

const campaigns = [
  {
    name: "InsureTech",
    description: "Insurance technology companies transforming the insurance industry",
    companies: [
      { name: "PolicyPro", domain: "policypro.com", industry: Industry.Fintech },
      { name: "ClaimsFast", domain: "claimsfast.io", industry: Industry.Fintech },
      { name: "InsureAI", domain: "insureai.com", industry: Industry.Technology },
      { name: "RiskGuard", domain: "riskguard.io", industry: Industry.SaaS },
      { name: "AutoCover", domain: "autocover.com", industry: Industry.Technology },
      { name: "HealthShield Insurance", domain: "healthshield.com", industry: Industry.Healthcare },
      { name: "SmartClaims", domain: "smartclaims.io", industry: Industry.SaaS },
      { name: "InsureNow", domain: "insurenow.com", industry: Industry.Fintech },
      { name: "CoverageAI", domain: "coverageai.io", industry: Industry.Technology },
      { name: "QuickQuote Insurance", domain: "quickquote.com", industry: Industry.SaaS },
      { name: "PetProtect", domain: "petprotect.com", industry: Industry.Technology },
      { name: "TravelSafe Insurance", domain: "travelsafe.com", industry: Industry.Fintech },
      { name: "HomeGuardian", domain: "homeguardian.io", industry: Industry.Technology },
      { name: "BusinessShield", domain: "businessshield.com", industry: Industry.Fintech },
      { name: "LifeSecure", domain: "lifesecure.io", industry: Industry.Technology },
      { name: "CyberInsure", domain: "cyberinsure.com", industry: Industry.SaaS },
      { name: "FloodProtect", domain: "floodprotect.io", industry: Industry.Technology },
      { name: "AccidentCare", domain: "accidentcare.com", industry: Industry.Healthcare },
      { name: "DisabilityGuard", domain: "disabilityguard.io", industry: Industry.Fintech },
    ]
  },
  {
    name: "HealthTech",
    description: "Healthcare technology companies revolutionizing patient care and medical services",
    companies: [
      { name: "MediConnect", domain: "mediconnect.com", industry: Industry.Healthcare },
      { name: "HealthHub Pro", domain: "healthhubpro.io", industry: Industry.Healthcare },
      { name: "TeleMed Solutions", domain: "telemedsolutions.com", industry: Industry.Healthcare },
      { name: "PatientFirst", domain: "patientfirst.io", industry: Industry.Healthcare },
      { name: "DiagnosticAI", domain: "diagnosticai.com", industry: Industry.Healthcare },
      { name: "PharmaTech", domain: "pharmatech.io", industry: Industry.Healthcare },
      { name: "LabSync", domain: "labsync.com", industry: Industry.Healthcare },
      { name: "CareCoordinator", domain: "carecoordinator.io", industry: Industry.SaaS },
      { name: "HealthRecords Plus", domain: "healthrecordsplus.com", industry: Industry.SaaS },
      { name: "VitalTrack", domain: "vitaltrack.io", industry: Industry.Healthcare },
      { name: "MentalWellness", domain: "mentalwellness.com", industry: Industry.Healthcare },
      { name: "SurgeryScheduler", domain: "surgeryscheduler.io", industry: Industry.SaaS },
      { name: "DentalPro", domain: "dentalpro.com", industry: Industry.Healthcare },
      { name: "RadiologyCloud", domain: "radiologycloud.io", industry: Industry.Healthcare },
      { name: "HomeHealth Connect", domain: "homehealthconnect.com", industry: Industry.Healthcare },
      { name: "FitnessRx", domain: "fitnessrx.io", industry: Industry.Healthcare },
      { name: "NutritionTrack", domain: "nutritiontrack.com", industry: Industry.Healthcare },
      { name: "BioMetrics", domain: "biometrics.io", industry: Industry.Healthcare },
    ]
  },
  {
    name: "FinTech",
    description: "Financial technology companies modernizing banking, payments, and financial services",
    companies: [
      { name: "PayFast", domain: "payfast.com", industry: Industry.Fintech },
      { name: "LendingPro", domain: "lendingpro.io", industry: Industry.Fintech },
      { name: "CryptoTrade", domain: "cryptotrade.com", industry: Industry.Fintech },
      { name: "WealthManage", domain: "wealthmanage.io", industry: Industry.Fintech },
      { name: "BankingAI", domain: "bankingai.com", industry: Industry.Fintech },
      { name: "InvoiceFlow", domain: "invoiceflow.io", industry: Industry.SaaS },
      { name: "ExpenseTracker Pro", domain: "expensetrackerro.com", industry: Industry.SaaS },
      { name: "PayrollPro", domain: "payrollpro.io", industry: Industry.Fintech },
      { name: "InvestSmart", domain: "investsmart.com", industry: Industry.Fintech },
      { name: "TaxOptimize", domain: "taxoptimize.io", industry: Industry.SaaS },
      { name: "FraudGuard", domain: "fraudguard.com", industry: Industry.Fintech },
      { name: "MobileWallet", domain: "mobilewallet.io", industry: Industry.Fintech },
      { name: "P2P Transfer", domain: "p2ptransfer.com", industry: Industry.Fintech },
      { name: "CreditScore Plus", domain: "creditscoreplus.io", industry: Industry.Fintech },
      { name: "MortgageTech", domain: "mortgagetech.com", industry: Industry.Fintech },
      { name: "TradingDesk", domain: "tradingdesk.io", industry: Industry.Fintech },
      { name: "ComplianceHub", domain: "compliancehub.com", industry: Industry.SaaS },
      { name: "FinancialPlan Pro", domain: "financialplanpro.io", industry: Industry.Fintech },
    ]
  }
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

function randomFutureDate(daysFromNow: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + randomNumber(1, daysFromNow));
  return date;
}

async function seed() {
  console.log("🌱 Starting database seed...");

  // Clear existing data (skip if tables don't exist yet)
  console.log("🧹 Clearing existing data...");
  try {
    await prisma.message.deleteMany();
    await prisma.call.deleteMany();
    await prisma.action.deleteMany();
    await prisma.sellerCompany.deleteMany();
    await prisma.campaign.deleteMany();
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

  // Create campaigns
  console.log("📋 Creating campaigns...");
  const createdCampaigns = [];
  for (const campaignData of campaigns) {
    const campaign = await prisma.campaign.create({
      data: {
        name: campaignData.name,
        description: campaignData.description,
      },
    });
    createdCampaigns.push({
      ...campaign,
      companies: campaignData.companies,
    });
  }
  console.log(`✅ Created ${createdCampaigns.length} campaigns`);

  // Create seller companies
  console.log("🏢 Creating seller companies...");
  const createdCompanies: Array<{ id: string; name: string; industry: string; ownerBankerId: string; ownerBankerName: string }> = [];

  for (const campaign of createdCampaigns) {
    for (const companyData of campaign.companies) {
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
      const website = hasWebsite
        ? `https://${companyData.domain}`
        : undefined;

      // Generate valuation for 40% of companies (usually more advanced stage)
      const hasValuation = Math.random() > 0.6 || isActiveDeal;
      const valuation = hasValuation
        ? Math.floor(revenue * randomNumber(3, 12))
        : undefined;

      const company = await prisma.sellerCompany.create({
        data: {
          name: companyData.name,
          industry: companyData.industry,
          revenue,
          ebitda,
          headcount: randomNumber(5, 500),
          geography: randomElement(geographies),
          dealStage,
          campaignId: campaign.id,
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
        industry: companyData.industry,
        ownerBankerId: banker.id,
        ownerBankerName: banker.name,
      });
    }
  }
  console.log(`✅ Created ${createdCompanies.length} seller companies`);

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

  // Create actions for each company
  console.log("📅 Creating actions...");
  let totalActions = 0;
  let totalCompletedActions = 0;

  for (const company of createdCompanies) {
    // Each company gets 1-2 pending actions
    const actionCount = randomNumber(1, 2);

    for (let i = 0; i < actionCount; i++) {
      // 30% chance this is an email task instead of call
      const isEmailAction = Math.random() < 0.3;
      const actionType = isEmailAction ? ActionType.email : ActionType.call;

      // Determine if this is an overdue, current, or future action
      const actionTiming = randomNumber(1, 100);
      let scheduledFor: Date;
      let description: string;
      let title: string;

      if (isEmailAction) {
        if (actionTiming <= 20) {
          // 20% chance: Overdue action (1-5 days ago)
          scheduledFor = randomDate(5);
          description = `Send follow-up email with updated deal materials to ${company.name}.`;
          title = `Send follow-up email to ${company.name}`;
        } else if (actionTiming <= 40) {
          // 20% chance: Today or tomorrow
          scheduledFor = randomNumber(1, 2) === 1 ? new Date() : new Date(Date.now() + 24 * 60 * 60 * 1000);
          description = `Send proposal and market analysis to ${company.name}.`;
          title = `Send proposal to ${company.name}`;
        } else {
          // 60% chance: Future action (1-30 days)
          scheduledFor = randomFutureDate(30);
          description = `Send quarterly check-in email to ${company.name} about market conditions.`;
          title = `Send check-in email to ${company.name}`;
        }
      } else {
        if (actionTiming <= 20) {
          // 20% chance: Overdue action (1-5 days ago)
          scheduledFor = randomDate(5);
          description = `Overdue follow-up from previous call. Need to reconnect with ${company.name}.`;
          title = `Follow-up call with ${company.name}`;
        } else if (actionTiming <= 40) {
          // 20% chance: Today or tomorrow
          scheduledFor = randomNumber(1, 2) === 1 ? new Date() : new Date(Date.now() + 24 * 60 * 60 * 1000);
          description = `Scheduled follow-up call to discuss next steps with ${company.name}.`;
          title = `Follow-up call with ${company.name}`;
        } else {
          // 60% chance: Future action (1-30 days)
          scheduledFor = randomFutureDate(30);
          description = `Follow-up call scheduled to check in on ${company.name}'s interest and timeline.`;
          title = `Follow-up call with ${company.name}`;
        }
      }

      await prisma.action.create({
        data: {
          sellerCompanyId: company.id,
          actionType,
          scheduledFor,
          status: ActionStatus.pending,
          title,
          description,
        },
      });

      totalActions++;
    }

    // 60% chance to have 1-2 completed actions
    if (Math.random() < 0.6) {
      const completedCount = randomNumber(1, 2);

      for (let i = 0; i < completedCount; i++) {
        const isEmailAction = Math.random() < 0.4;
        const actionType = isEmailAction ? ActionType.email : ActionType.call;

        // Completed actions from 1-14 days ago
        const scheduledFor = randomDate(14);
        // Updated timestamp to show recent completion (within 1-7 days)
        const updatedAt = new Date(scheduledFor.getTime() + randomNumber(1, 7) * 24 * 60 * 60 * 1000);

        let title: string;
        let description: string;

        if (isEmailAction) {
          title = `Sent proposal to ${company.name}`;
          description = `Sent detailed proposal and market analysis via email.`;
        } else {
          title = `Completed call with ${company.name}`;
          description = `Had productive conversation about their interest in M&A opportunities.`;
        }

        await prisma.action.create({
          data: {
            sellerCompanyId: company.id,
            actionType,
            scheduledFor,
            status: ActionStatus.completed,
            title,
            description,
            updatedAt,
          },
        });

        totalCompletedActions++;
      }
    }
  }

  console.log(`✅ Created ${totalActions} pending actions`);
  console.log(`✅ Created ${totalCompletedActions} completed actions`);

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
