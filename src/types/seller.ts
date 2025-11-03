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
  logoUrl?: string;
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
  automated_outreach: "bg-muted/30 text-muted-foreground border border-border",
  dealer_outreach: "bg-muted/40 text-foreground border border-border",
  pitch_meeting_planned: "bg-muted/50 text-foreground border border-border",
  proposal_sent: "bg-muted/60 text-foreground border border-border",
  mandate_signed: "bg-muted/70 text-foreground border border-border",
  deal_material_creation: "bg-muted/60 text-foreground border border-border",
  buyer_reachouts: "bg-muted/70 text-foreground border border-border",
  deal_negotiations: "bg-muted/80 text-foreground border border-border",
  deal_closed: "bg-muted text-foreground border border-border",
  deal_lost: "bg-muted/40 text-muted-foreground border border-border",
  re_engage_later: "bg-muted/30 text-muted-foreground border border-border",
};
