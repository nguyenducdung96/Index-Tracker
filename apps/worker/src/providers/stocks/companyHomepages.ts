export type VerifiedCompanyHomepage = {
  symbol: string;
  url: string;
  source: "verified-registry";
};

/**
 * Official company homepages that have been independently verified.
 *
 * This registry is intentionally conservative:
 * - only add a symbol after the website is verified as the listed company's
 *   official corporate site;
 * - never infer a domain from the ticker;
 * - market data remains VNDIRECT and is completely independent of this file.
 *
 * The dynamic metadata resolver remains active for symbols not in this map.
 */
const VERIFIED_HOME_PAGES: Record<string, string> = {
  HPG: "https://www.hoaphat.com.vn/",
  HSG: "https://www.hoasengroup.vn/",
  NKG: "https://www.namkimsteel.com.vn/",
  VGS: "https://vgpipe.com.vn/"
};

export function getVerifiedCompanyHomepage(
  symbol: string
): VerifiedCompanyHomepage | null {
  const code = symbol.trim().toUpperCase();
  const url = VERIFIED_HOME_PAGES[code];
  return url ? { symbol: code, url, source: "verified-registry" } : null;
}
