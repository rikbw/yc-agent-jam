import type { Industry as DbIndustry } from "@/generated/prisma/enums";
import type { Industry } from "@/types/seller";

const industryMap: Record<DbIndustry, Industry> = {
  SaaS: "SaaS",
  E_commerce: "E-commerce",
  Manufacturing: "Manufacturing",
  Healthcare: "Healthcare",
  Fintech: "Fintech",
  Food_Beverage: "Food & Beverage",
  Professional_Services: "Professional Services",
  Technology: "Technology",
  Logistics: "Logistics",
  Real_Estate: "Real Estate",
};

export function mapDbIndustryToType(dbIndustry: DbIndustry): Industry {
  return industryMap[dbIndustry];
}
