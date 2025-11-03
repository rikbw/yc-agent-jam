/**
 * Fetch company logo from Logo.dev API
 * @param domain - The company domain (e.g., "google.com")
 * @returns The logo URL or null if not found
 */
export async function fetchCompanyLogo(
  domain: string | null | undefined
): Promise<string | null> {
  if (!domain) return null;

  const apiKey = process.env.LOGO_DEV_API_KEY;
  if (!apiKey) {
    console.warn("LOGO_DEV_API_KEY is not configured");
    return null;
  }

  try {
    // Clean the domain - remove protocol, www, and trailing slashes
    const cleanDomain = domain
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/$/, "")
      .split("/")[0]; // Take only the domain part

    // Logo.dev API endpoint
    const url = `https://img.logo.dev/${cleanDomain}?token=${apiKey}&size=200&format=png`;

    // Test if the logo exists by making a HEAD request
    const response = await fetch(url, { method: "HEAD" });

    if (response.ok) {
      return url;
    } 

    console.error(`Error fetching logo for domain ${domain}:`, response.statusText);

    return null;
  } catch (error) {
    console.error(`Error fetching logo for domain ${domain}:`, error);
    return null;
  }
}

/**
 * Extract domain from website URL
 */
export function extractDomain(website: string | null | undefined): string | null {
  if (!website) return null;

  try {
    const cleanDomain = website
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/$/, "")
      .split("/")[0];

    return cleanDomain;
  } catch {
    return null;
  }
}

/**
 * Get logo.dev URL for a company domain (client-safe)
 * @param website - The company website URL
 * @returns The logo.dev URL or null if domain cannot be extracted
 */
export function getLogoDevUrl(website: string | null | undefined): string | null {
  if (!website) return null;

  const apiKey = process.env.NEXT_PUBLIC_LOGO_DEV_API_KEY;
  if (!apiKey) {
    console.warn("NEXT_PUBLIC_LOGO_DEV_API_KEY is not configured");
    return null;
  }

  const cleanDomain = extractDomain(website);
  if (!cleanDomain) return null;

  return `https://img.logo.dev/${cleanDomain}?token=${apiKey}&size=200&format=png`;
}
