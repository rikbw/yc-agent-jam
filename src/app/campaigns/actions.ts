"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { OrganizationSearchParamsSchema, OrganizationSearchParams } from "@/types/apollo";
import { InputJsonValue } from "@prisma/client/runtime/library";
import { searchOrganizations, searchCompaniesWithPerplexity } from "@/lib/apollo";
import { Industry } from "@/generated/prisma/client";

const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

export async function generateCampaignParams(name: string, description: string) {
  if (!name) {
    throw new Error("Campaign name is required");
  }

  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const prompt = `You are an expert at translating business campaign descriptions into Apollo.io search parameters.

Campaign Name: ${name}
Campaign Description: ${description || "Not provided"}

Based on this campaign, generate the appropriate Apollo.io organization search parameters. Consider:
- Employee count ranges (format: "1,10", "11,50", "51,200", "201,500", "501,1000", "1001,2000", "2001,5000", "5001,10000", "10001+")
- Revenue ranges (in USD)
- Industry keywords and tags
- Geographic location (city, state, country)
- Funding stages if relevant (seed, series_a, series_b, ipo, etc.)
- Technologies they might use
- Job titles and seniorities for key decision makers
- Founding year ranges if relevant

Be specific and targeted based on the campaign description. Only include fields that are relevant to this campaign.`;

  try {
    const { object } = await generateObject({
      model: openrouter("openai/gpt-4o-mini"),
      schema: OrganizationSearchParamsSchema,
      prompt,
    });

    return { success: true, params: object };
  } catch (error) {
    console.error("Error generating campaign params:", error);
    throw new Error("Failed to generate campaign parameters. Please try again.");
  }
}

/**
 * Map Apollo industry string to our Industry enum
 */
function mapIndustry(apolloIndustry: string | null | undefined): Industry {
  if (!apolloIndustry) return Industry.Technology;

  const industryLower = apolloIndustry.toLowerCase();

  if (industryLower.includes("saas") || industryLower.includes("software")) return Industry.SaaS;
  if (industryLower.includes("ecommerce") || industryLower.includes("e-commerce") || industryLower.includes("retail")) return Industry.E_commerce;
  if (industryLower.includes("manufacturing")) return Industry.Manufacturing;
  if (industryLower.includes("healthcare") || industryLower.includes("health") || industryLower.includes("medical")) return Industry.Healthcare;
  if (industryLower.includes("fintech") || industryLower.includes("finance") || industryLower.includes("financial")) return Industry.Fintech;
  if (industryLower.includes("food") || industryLower.includes("beverage") || industryLower.includes("restaurant")) return Industry.Food_Beverage;
  if (industryLower.includes("professional services") || industryLower.includes("consulting")) return Industry.Professional_Services;
  if (industryLower.includes("logistics") || industryLower.includes("transportation") || industryLower.includes("shipping")) return Industry.Logistics;
  if (industryLower.includes("real estate") || industryLower.includes("property")) return Industry.Real_Estate;

  return Industry.Technology;
}

/**
 * Search for organizations using Apollo API and sync them to the campaign
 */
export async function searchAndSyncOrganizations(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  if (!campaign.searchParams) {
    throw new Error("Campaign has no search parameters");
  }

  // Get or create a default banker to assign companies to
  let defaultBanker = await prisma.banker.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!defaultBanker) {
    defaultBanker = await prisma.banker.create({
      data: {
        name: "Default Banker",
        email: "banker@example.com",
      },
    });
  }

  try {
    // Call Perplexity via OpenRouter with the campaign's search parameters
    const searchParams = campaign.searchParams as OrganizationSearchParams;
    const results = await searchCompaniesWithPerplexity({
      ...searchParams,
      per_page: 25, // Limit to 25 results per sync
      page: 1,
    });

    // Map Apollo organizations to our SellerCompany schema
    const companies = results.organizations.map((org) => {
      const revenue = org.annual_revenue || 1000000; // Default 1M if not available
      const ebitda = Math.round(revenue * 0.2); // Estimate 20% EBITDA margin

      const geography = [org.city, org.state, org.country]
        .filter(Boolean)
        .join(", ") || "Unknown";

      return {
        name: org.name,
        industry: mapIndustry(org.industry),
        revenue,
        ebitda,
        headcount: org.estimated_num_employees || 50,
        geography,
        dealStage: "automated_outreach" as const,
        campaignId: campaign.id,
        ownerBankerId: defaultBanker.id,
        lastContactDate: new Date(),
        estimatedDealSize: Math.round(revenue * 0.5), // Estimate 0.5x revenue
        likelihoodToSell: 50, // Default 50% likelihood
        website: org.website_url || org.primary_domain || undefined,
        valuation: org.total_funding ? Math.round(org.total_funding * 1.5) : undefined,
      };
    });

    // Bulk create or update companies
    // First, delete existing companies from this campaign to avoid duplicates
    await prisma.sellerCompany.deleteMany({
      where: { campaignId: campaign.id },
    });

    // Then create new companies
    await prisma.sellerCompany.createMany({
      data: companies,
    });

    revalidatePath(`/campaigns/${campaignId}`);
    revalidatePath("/campaigns");

    return {
      success: true,
      count: companies.length,
      total: results.pagination.total_entries,
    };
  } catch (error) {
    console.error("Error syncing organizations:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to search and sync organizations"
    );
  }
}

export async function createCampaign(
  name: string,
  description: string,
  searchParams: InputJsonValue
) {
  if (!name) {
    throw new Error("Campaign name is required");
  }

  const campaign = await prisma.campaign.create({
    data: {
      name,
      description: description || null,
      searchParams,
    },
  });

  // Automatically sync organizations from Apollo
  try {
    await searchAndSyncOrganizations(campaign.id);
  } catch (error) {
    console.error("Error syncing organizations on campaign creation:", error);
    // Don't fail campaign creation if sync fails
  }

  revalidatePath("/campaigns");
}
