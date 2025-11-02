/**
 * Apollo.io API Client
 *
 * Wrapper for Apollo.io API endpoints
 * Documentation: https://docs.apollo.io/
 */

import { z } from 'zod';
import type {
  OrganizationSearchParams,
  OrganizationSearchResponse,
  ApolloApiError,
  ApolloOrganization,
  BulkEnrichOrganizationsResponse,
} from '@/types/apollo';
import {
  OrganizationSearchResponseSchema,
  ApolloOrganizationSchema,
  BulkEnrichOrganizationsResponseSchema,
} from '@/types/apollo';
import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const APOLLO_API_BASE_URL = 'https://api.apollo.io';
const APOLLO_API_VERSION = 'v1';

/**
 * Get Apollo API key from environment variables
 */
function getApiKey(): string {
  const apiKey = process.env.APOLLO_API_KEY;

  if (!apiKey) {
    throw new Error(
      'APOLLO_API_KEY is not set in environment variables. ' +
      'Please add it to your .env file.'
    );
  }

  return apiKey;
}

/**
 * Make a request to the Apollo API with Zod schema validation
 */
async function apolloRequest<T>(
  endpoint: string,
  schema: z.ZodSchema<T>,
  options: RequestInit = {}
): Promise<T> {
  const apiKey = getApiKey();
  const url = `${APOLLO_API_BASE_URL}/api/${APOLLO_API_VERSION}${endpoint}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
      'X-Api-Key': apiKey,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as ApolloApiError;
    throw new Error(
      `Apollo API Error (${response.status}): ${
        errorData.message || errorData.error || response.statusText
      }`
    );
  }

  const data = await response.json();

  // Parse and validate the response with Zod
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError;
      console.error('Apollo API response validation error:', zodError.issues);
      throw new Error(
        `Invalid response format from Apollo API: ${zodError.issues
          .map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`)
          .join(', ')}`
      );
    }
    throw error;
  }
}

/**
 * Search for organizations in the Apollo database
 *
 * This endpoint enables searching for companies with various filtering options.
 * Note: This feature requires an active Apollo pricing plan and consumes credits.
 *
 * Display Limitations:
 * - Maximum 50,000 records can be displayed
 * - 100 results per page maximum
 * - Up to 500 pages maximum
 * - Add more filters to narrow results if you hit the limit
 *
 * @param params - Search parameters for filtering organizations
 * @returns Promise with organizations and pagination info
 *
 * @example
 * ```typescript
 * const results = await searchOrganizations({
 *   q_organization_name: "Apollo",
 *   organization_locations: [{ city: "San Francisco", state: "California" }],
 *   organization_num_employees_ranges: ["51,200", "201,500"],
 *   per_page: 25,
 *   page: 1
 * });
 *
 * console.log(`Found ${results.pagination.total_entries} organizations`);
 * results.organizations.forEach(org => {
 *   console.log(`${org.name} - ${org.website_url}`);
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Search for tech companies in specific industries
 * const techCompanies = await searchOrganizations({
 *   q_organization_keyword_tags: ["Software", "Technology"],
 *   organization_num_employees_ranges: ["501,1000", "1001,2000"],
 *   revenue_range: { min: 1000000, max: 10000000 },
 *   page: 1,
 *   per_page: 50
 * });
 * ```
 */
export async function searchOrganizations(
  params: OrganizationSearchParams = {}
): Promise<OrganizationSearchResponse> {
  return apolloRequest<OrganizationSearchResponse>(
    '/mixed_companies/search',
    OrganizationSearchResponseSchema,
    {
      method: 'POST',
      body: JSON.stringify(params),
    }
  );
}

/**
 * Bulk enrich organizations by domain
 * 
 * Enriches up to 10 organizations in a single API call.
 * Returns full organization data including industry information.
 * 
 * @param domains - Array of domains (max 10)
 * @returns Promise with enriched organizations
 * 
 * @example
 * ```typescript
 * const orgs = await bulkEnrichOrganizations(["apollo.io", "google.com", "stripe.com"]);
 * orgs.forEach(org => {
 *   console.log(`${org.name} - ${org.industry}`);
 * });
 * ```
 */
export async function bulkEnrichOrganizations(
  domains: string[]
): Promise<ApolloOrganization[]> {
  if (domains.length === 0) return [];
  if (domains.length > 10) {
    throw new Error('Maximum 10 domains per bulk enrichment request');
  }

  const response = await apolloRequest<BulkEnrichOrganizationsResponse>(
    '/organizations/bulk_enrich',
    BulkEnrichOrganizationsResponseSchema,
    {
      method: 'POST',
      body: JSON.stringify({ domains }),
    }
  );

  // Handle both single org and bulk response formats
  if (response.organizations) {
    return response.organizations;
  } else if (response.organization) {
    return [response.organization];
  }
  return [];
}

/**
 * Search for companies using Apollo Organization Search API
 * 
 * Uses Organization Search which supports all current filters including
 * person_titles and person_seniorities to filter companies by roles.
 * 
 * @param params - Search parameters (same format as current UI)
 * @returns Promise with organizations in standard format
 * 
 * @example
 * ```typescript
 * const results = await searchCompaniesWithApollo({
 *   organization_locations: [{ city: "San Francisco", state: "California" }],
 *   organization_num_employees_ranges: ["51,200", "201,500"],
 *   person_titles: ["CEO", "CTO"],
 *   per_page: 25,
 * });
 * ```
 */
export async function searchCompaniesWithApollo(
  params: OrganizationSearchParams = {}
): Promise<OrganizationSearchResponse> {
  // Use Organization Search directly - it supports all our filters
  return searchOrganizations(params);
}

/**
 * Search for companies using Perplexity AI via OpenRouter
 *
 * This function uses Perplexity to search for real companies that match the given criteria.
 * Instead of using Apollo's API, it leverages Perplexity's real-time web search capabilities
 * to find companies and return them in Apollo-compatible format.
 *
 * @param params - Search parameters (same format as Apollo API)
 * @returns Promise with organizations in Apollo format
 *
 * @example
 * ```typescript
 * const results = await searchCompaniesWithPerplexity({
 *   organization_locations: [{ city: "San Francisco", state: "California" }],
 *   organization_num_employees_ranges: ["51,200", "201,500"],
 *   q_organization_keyword_tags: ["SaaS", "Technology"],
 *   per_page: 25,
 * });
 * ```
 */
export async function searchCompaniesWithPerplexity(
  params: OrganizationSearchParams = {}
): Promise<OrganizationSearchResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error(
      'OPENROUTER_API_KEY is not set in environment variables. ' +
      'Please add it to your .env file.'
    );
  }

  const openrouter = createOpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
  });

  const perPage = params.per_page || 25;

  const prompt = `Find ${perPage} real companies that match the following search criteria:

${JSON.stringify(params, null, 2)}

For each company, provide accurate and complete information. Use your real-time web search capabilities to find current, accurate data about these companies. Return ${perPage} companies that best match these criteria. Prioritize companies with complete, verifiable information.`;

  try {
    // Define the schema for a list of organizations
    const OrganizationListSchema = z.object({
      organizations: z.array(z.object({
        name: z.string().describe('Company name'),
        website_url: z.string().nullable().optional().describe('Company website URL'),
        primary_domain: z.string().nullable().optional().describe('Primary domain of the company'),
        industry: z.string().nullable().optional().describe('Industry or sector'),
        estimated_num_employees: z.number().nullable().optional().describe('Estimated number of employees'),
        annual_revenue: z.number().nullable().optional().describe('Annual revenue in USD'),
        city: z.string().nullable().optional().describe('City where company is located'),
        state: z.string().nullable().optional().describe('State/province where company is located'),
        country: z.string().nullable().optional().describe('Country where company is located'),
        founded_year: z.number().nullable().optional().describe('Year the company was founded'),
        linkedin_url: z.string().nullable().optional().describe('LinkedIn company page URL'),
        short_description: z.string().nullable().optional().describe('Brief description of the company'),
        technology_names: z.array(z.string()).optional().describe('Technologies the company uses'),
        total_funding: z.number().nullable().optional().describe('Total funding raised in USD'),
        latest_funding_stage: z.string().nullable().optional().describe('Latest funding stage (e.g., seed, series_a, series_b)'),
        logo_url: z.string().nullable().optional().describe('Company logo URL'),
      })),
    });

    const { object } = await generateObject({
      model: openrouter('perplexity/sonar-pro-search'),
      schema: OrganizationListSchema,
      prompt,
    });

    // Transform the results to match Apollo's format
    const organizations = object.organizations.map((org, index) => ({
      id: `perplexity-${Date.now()}-${index}`,
      name: org.name,
      website_url: org.website_url || null,
      primary_domain: org.primary_domain || org.website_url?.replace(/^https?:\/\//, '').replace(/\/.*$/, '') || null,
      blog_url: null,
      angellist_url: null,
      linkedin_url: org.linkedin_url || null,
      twitter_url: null,
      facebook_url: null,
      primary_phone: null,
      languages: [],
      alexa_ranking: null,
      phone: null,
      linkedin_uid: null,
      founded_year: org.founded_year || null,
      publicly_traded_symbol: null,
      publicly_traded_exchange: null,
      logo_url: org.logo_url || null,
      crunchbase_url: null,
      industry: org.industry || null,
      keywords: [],
      estimated_num_employees: org.estimated_num_employees || null,
      snippets_loaded: false,
      industry_tag_id: null,
      retail_location_count: null,
      raw_address: null,
      street_address: null,
      city: org.city || null,
      state: org.state || null,
      postal_code: null,
      country: org.country || null,
      owned_by_organization_id: null,
      suborganizations: [],
      num_suborganizations: null,
      seo_description: null,
      short_description: org.short_description || null,
      annual_revenue_printed: org.annual_revenue ? `$${org.annual_revenue.toLocaleString()}` : null,
      annual_revenue: org.annual_revenue || null,
      total_funding: org.total_funding || null,
      total_funding_printed: org.total_funding ? `$${org.total_funding.toLocaleString()}` : null,
      latest_funding_round_date: null,
      latest_funding_stage: org.latest_funding_stage || null,
      funding_events: [],
      technology_names: org.technology_names || [],
      current_technologies: [],
      account_id: null,
      account: null,
      organization_raw_address: null,
      organization_city: org.city || null,
      organization_street_address: null,
      organization_state: org.state || null,
      organization_country: org.country || null,
      organization_postal_code: null,
      sanitized_phone: null,
      intent_strength: null,
      show_intent: false,
      has_intent_signal_account: false,
      intent_signal_account: null,
    }));

    return {
      organizations,
      pagination: {
        page: params.page || 1,
        per_page: perPage,
        total_entries: organizations.length,
        total_pages: 1,
      },
      breadcrumbs: [],
      partial_results_only: false,
      disable_eu_prospecting: false,
    };
  } catch (error) {
    console.error('Error searching companies with Perplexity:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to search companies with Perplexity'
    );
  }
}
