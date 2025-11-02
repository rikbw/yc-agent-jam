export type DealStage =
  | "automated_outreach"
  | "dealer_outreach"
  | "pitch_meeting_planned"
  | "proposal_sent"
  | "mandate_signed"
  | "deal_material_creation"
  | "buyer_reachouts"
  | "deal_negotiations"
  | "deal_closed"
  | "deal_lost"
  | "re_engage_later";

export type Industry =
  | "SaaS"
  | "E-commerce"
  | "Manufacturing"
  | "Healthcare"
  | "Fintech"
  | "Food & Beverage"
  | "Professional Services"
  | "Technology"
  | "Logistics"
  | "Real Estate";

export type SellerCompany = {
  id: string;
  name: string;
  industry: Industry;
  revenue: number; // in EUR
  ebitda: number; // in EUR
  headcount: number;
  geography: string;
  dealStage: DealStage;
  campaignId?: string;
  campaignName?: string;
  ownerBankerId: string;
  ownerBankerName: string;
  lastContactDate: Date;
  estimatedDealSize: number; // in EUR
  likelihoodToSell: number; // 0-100
  website?: string;
  valuation?: number; // in EUR
  createdAt: Date;
};

export const DEAL_STAGE_LABELS: Record<DealStage, string> = {
  automated_outreach: "Automated Outreach",
  dealer_outreach: "Dealer Outreach",
  pitch_meeting_planned: "Pitch Meeting Planned",
  proposal_sent: "Proposal Sent",
  mandate_signed: "Mandate Signed",
  deal_material_creation: "Deal Material Creation",
  buyer_reachouts: "Buyer Reachouts",
  deal_negotiations: "Deal Negotiations",
  deal_closed: "Deal Closed",
  deal_lost: "Deal Lost",
  re_engage_later: "Re-engage Later",
};

export const DEAL_STAGE_COLORS: Record<DealStage, string> = {
  automated_outreach: "bg-slate-100 text-slate-800",
  dealer_outreach: "bg-blue-100 text-blue-800",
  pitch_meeting_planned: "bg-purple-100 text-purple-800",
  proposal_sent: "bg-yellow-100 text-yellow-800",
  mandate_signed: "bg-green-100 text-green-800",
  deal_material_creation: "bg-cyan-100 text-cyan-800",
  buyer_reachouts: "bg-indigo-100 text-indigo-800",
  deal_negotiations: "bg-orange-100 text-orange-800",
  deal_closed: "bg-green-500 text-white",
  deal_lost: "bg-red-100 text-red-800",
  re_engage_later: "bg-gray-100 text-gray-800",
};
