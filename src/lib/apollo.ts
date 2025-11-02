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
} from '@/types/apollo';
import { OrganizationSearchResponseSchema } from '@/types/apollo';

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
