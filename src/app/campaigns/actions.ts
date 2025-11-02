"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { OrganizationSearchParamsSchema } from "@/types/apollo";
import { InputJsonValue } from "@prisma/client/runtime/library";

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

export async function createCampaign(
  name: string,
  description: string,
  searchParams: InputJsonValue
) {
  if (!name) {
    throw new Error("Campaign name is required");
  }

  await prisma.campaign.create({
    data: {
      name,
      description: description || null,
      searchParams,
    },
  });

  revalidatePath("/campaigns");
}
