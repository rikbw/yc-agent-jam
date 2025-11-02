/**
 * Apollo.io API Types
 * Documentation: https://docs.apollo.io/reference/organization-search
 */

import { z } from 'zod';

/**
 * Location filter for organization search
 */
export interface OrganizationLocation {
  city?: string;
  state?: string;
  country?: string;
}

/**
 * Revenue range filter
 */
export interface RevenueRange {
  min?: number;
  max?: number;
}

/**
 * Employee count ranges
 * Common ranges: "1,10", "11,50", "51,200", "201,500", "501,1000", "1001,2000", "2001,5000", "5001,10000", "10001+"
 */
export type EmployeeRange = string;

// ============================================================================
// Zod Schemas
// ============================================================================

/**
 * Schema for breadcrumb items in search results
 */
export const BreadcrumbSchema = z.object({
  label: z.string(),
  signal_field_name: z.string(),
  value: z.string(),
  display_name: z.string(),
});

/**
 * Schema for primary phone information
 */
export const PrimaryPhoneSchema = z.object({
  number: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  sanitized_number: z.string().optional().nullable(),
});

/**
 * Schema for intent signal account
 */
export const IntentSignalAccountSchema = z.any().nullable();

/**
 * Schema for pagination information
 */
export const PaginationSchema = z.object({
  page: z.number(),
  per_page: z.number(),
  total_entries: z.number(),
  total_pages: z.number(),
});

/**
 * Schema for organization data from Apollo
 */
export const ApolloOrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  website_url: z.string().nullable().optional(),
  blog_url: z.string().nullable().optional(),
  angellist_url: z.string().nullable().optional(),
  linkedin_url: z.string().nullable().optional(),
  twitter_url: z.string().nullable().optional(),
  facebook_url: z.string().nullable().optional(),
  primary_phone: PrimaryPhoneSchema.nullable().optional(),
  languages: z.array(z.string()).optional(),
  alexa_ranking: z.number().nullable().optional(),
  phone: z.string().nullable().optional(),
  linkedin_uid: z.string().nullable().optional(),
  founded_year: z.number().nullable().optional(),
  publicly_traded_symbol: z.string().nullable().optional(),
  publicly_traded_exchange: z.string().nullable().optional(),
  logo_url: z.string().nullable().optional(),
  crunchbase_url: z.string().nullable().optional(),
  primary_domain: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  keywords: z.array(z.string()).optional(),
  estimated_num_employees: z.number().nullable().optional(),
  snippets_loaded: z.boolean().optional(),
  industry_tag_id: z.string().nullable().optional(),
  retail_location_count: z.number().nullable().optional(),
  raw_address: z.string().nullable().optional(),
  street_address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  postal_code: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  owned_by_organization_id: z.string().nullable().optional(),
  suborganizations: z.array(z.any()).optional(),
  num_suborganizations: z.number().nullable().optional(),
  seo_description: z.string().nullable().optional(),
  short_description: z.string().nullable().optional(),
  annual_revenue_printed: z.string().nullable().optional(),
  annual_revenue: z.number().nullable().optional(),
  total_funding: z.number().nullable().optional(),
  total_funding_printed: z.string().nullable().optional(),
  latest_funding_round_date: z.string().nullable().optional(),
  latest_funding_stage: z.string().nullable().optional(),
  funding_events: z.array(z.any()).optional(),
  technology_names: z.array(z.string()).optional(),
  current_technologies: z.array(z.any()).optional(),
  account_id: z.string().nullable().optional(),
  account: z.any().nullable().optional(),
  organization_raw_address: z.string().nullable().optional(),
  organization_city: z.string().nullable().optional(),
  organization_street_address: z.string().nullable().optional(),
  organization_state: z.string().nullable().optional(),
  organization_country: z.string().nullable().optional(),
  organization_postal_code: z.string().nullable().optional(),
  sanitized_phone: z.string().nullable().optional(),
  intent_strength: z.any().nullable().optional(),
  show_intent: z.boolean().optional(),
  has_intent_signal_account: z.boolean().optional(),
  intent_signal_account: IntentSignalAccountSchema.optional(),
}).passthrough(); // Allow additional fields

/**
 * Schema for organization search response
 */
export const OrganizationSearchResponseSchema = z.object({
  breadcrumbs: z.array(BreadcrumbSchema).optional(),
  partial_results_only: z.boolean().optional(),
  has_join: z.boolean().optional(),
  disable_eu_prospecting: z.boolean().optional(),
  partial_results_limit: z.number().optional(),
  pagination: PaginationSchema,
  accounts: z.array(z.any()).optional(),
  organizations: z.array(ApolloOrganizationSchema),
  model_ids: z.array(z.string()).optional(),
  num_fetch_result: z.number().nullable().optional(),
  derived_params: z.any().nullable().optional(),
});

/**
 * Schema for organization location filter
 */
export const OrganizationLocationSchema = z.object({
  city: z.string().optional().describe('City name for filtering organizations'),
  state: z.string().optional().describe('State or province name for filtering organizations'),
  country: z.string().optional().describe('Country name for filtering organizations'),
});

/**
 * Schema for revenue range filter
 */
export const RevenueRangeSchema = z.object({
  min: z.number().optional().describe('Minimum annual revenue in USD'),
  max: z.number().optional().describe('Maximum annual revenue in USD'),
});

/**
 * Comprehensive Zod schema for organization search parameters
 *
 * Documentation: https://docs.apollo.io/reference/organization-search
 *
 * Note: This endpoint consumes credits and requires an active Apollo pricing plan.
 * Display limit: 50,000 records maximum (100 per page, up to 500 pages).
 */
export const OrganizationSearchParamsSchema = z.object({
  page: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe('Page number for pagination (starts at 1)'),

  per_page: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe('Number of results to return per page. Maximum 100 results per page.'),

  organization_locations: z
    .array(OrganizationLocationSchema)
    .optional()
    .describe('Search for organizations based on their headquarters location. Specify city, state, and/or country to filter by location.'),

  organization_num_employees_ranges: z
    .array(z.string())
    .optional()
    .describe('Filter organizations by employee count ranges. Common ranges: "1,10", "11,50", "51,200", "201,500", "501,1000", "1001,2000", "2001,5000", "5001,10000", "10001+".'),

  q_organization_keyword_tags: z
    .array(z.string())
    .optional()
    .describe('Search organizations by industry keywords or tags. Use this to filter by industry categories or business types.'),

  q_organization_name: z
    .string()
    .optional()
    .describe('Search for organizations by name. Supports partial name matching.'),

  organization_ids: z
    .array(z.string())
    .optional()
    .describe('Filter by specific organization IDs. Useful when you want to retrieve specific companies by their Apollo organization IDs.'),

  organization_industry_tag_ids: z
    .array(z.string())
    .optional()
    .describe('Filter organizations by industry tag IDs. Use Apollo\'s predefined industry classification tags.'),

  revenue_range: RevenueRangeSchema
    .optional()
    .describe('Filter organizations by annual revenue range. Specify min and max values in USD.'),

  organization_domains: z
    .array(z.string())
    .optional()
    .describe('Search for organizations by their website domains. Example: ["example.com", "test.org"].'),

  currently_using_any_of_technology_uids: z
    .array(z.string())
    .optional()
    .describe('Filter organizations by technologies they currently use. Specify technology UIDs from Apollo\'s technology database.'),

  organization_not_in_account_ids: z
    .array(z.string())
    .optional()
    .describe('Exclude organizations that are already in these account IDs. Useful for filtering out companies you\'re already working with.'),

  sort_by_field: z
    .string()
    .optional()
    .describe('Field name to sort results by. Common values include "name", "num_employees", "founded_year", etc.'),

  sort_ascending: z
    .boolean()
    .optional()
    .describe('Sort direction. Set to true for ascending order, false for descending order.'),

  publicly_traded_symbol: z
    .string()
    .optional()
    .describe('Filter by stock ticker symbol for publicly traded companies.'),

  publicly_traded_exchange: z
    .string()
    .optional()
    .describe('Filter by stock exchange where the company is listed (e.g., "NASDAQ", "NYSE").'),

  founded_year_min: z
    .number()
    .int()
    .optional()
    .describe('Minimum founding year for filtering organizations.'),

  founded_year_max: z
    .number()
    .int()
    .optional()
    .describe('Maximum founding year for filtering organizations.'),

  organization_not_using_any_of_technology_uids: z
    .array(z.string())
    .optional()
    .describe('Exclude organizations using specific technologies. Specify technology UIDs to filter out.'),

  q_organization_domains: z
    .array(z.string())
    .optional()
    .describe('Alternative parameter for searching by organization domains.'),

  person_titles: z
    .array(z.string())
    .optional()
    .describe('Filter organizations based on job titles of people within them. Useful for finding companies with specific roles.'),

  person_seniorities: z
    .array(z.string())
    .optional()
    .describe('Filter organizations by seniority levels of people within them (e.g., "executive", "director", "manager").'),

  prospected_by_current_team: z
    .array(z.string())
    .optional()
    .describe('Filter by team members who have prospected these organizations.'),

  organization_latest_funding_stage_cd: z
    .array(z.string())
    .optional()
    .describe('Filter by latest funding stage (e.g., "seed", "series_a", "series_b", "ipo").'),

  organization_total_funding: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional()
    .describe('Filter organizations by total funding amount range in USD.'),
}).passthrough(); // Allow additional undocumented parameters

// ============================================================================
// TypeScript Types (inferred from Zod schemas)
// ============================================================================

/**
 * Breadcrumb item in search results
 */
export type Breadcrumb = z.infer<typeof BreadcrumbSchema>;

/**
 * Primary phone information
 */
export type PrimaryPhone = z.infer<typeof PrimaryPhoneSchema>;

/**
 * Organization data returned from Apollo
 */
export type ApolloOrganization = z.infer<typeof ApolloOrganizationSchema>;

/**
 * Pagination info
 */
export type PaginationInfo = z.infer<typeof PaginationSchema>;

/**
 * Response from Apollo organization search
 */
export type OrganizationSearchResponse = z.infer<typeof OrganizationSearchResponseSchema>;

/**
 * Request parameters for Apollo organization search (inferred from Zod schema)
 *
 * This type includes all documented and common parameters for searching organizations.
 * Use OrganizationSearchParamsSchema.parse() for runtime validation.
 */
export type OrganizationSearchParams = z.infer<typeof OrganizationSearchParamsSchema>;

/**
 * Error response from Apollo API
 */
export interface ApolloApiError {
  error?: string;
  message?: string;
  status?: number;
}
