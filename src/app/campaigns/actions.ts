"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createCampaign(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  if (!name) {
    throw new Error("Campaign name is required");
  }

  await prisma.campaign.create({
    data: {
      name,
      description: description || null,
    },
  });

  revalidatePath("/campaigns");
}
