/**
 * Generates a SEO-friendly slug from a string
 * Converts to lowercase, removes special characters, replaces spaces with hyphens
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters except hyphens and underscores
    .replace(/[\s_]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Generates a unique slug for a PG listing
 * Format: pg-name-owner-name-area-city
 * Example: sunshine-pg-john-doe-vijay-nagar-indore
 */
export async function generateListingSlug(
  pgName: string,
  ownerName: string,
  area: string,
  city: string,
  uniqueId?: string
): Promise<string> {
  const pgSlug = generateSlug(pgName);
  const ownerSlug = generateSlug(ownerName);
  const areaSlug = generateSlug(area);
  const citySlug = generateSlug(city);
  
  // Combine: pg-name-owner-name-area-city
  // Example: sunshine-pg-john-doe-vijay-nagar-indore
  let baseSlug = `${pgSlug}-${ownerSlug}-${areaSlug}-${citySlug}`;
  
  // If we need uniqueness (e.g., same pg name, owner, and location exist), add unique part
  if (uniqueId) {
    const uniquePart = uniqueId.slice(-6).toLowerCase();
    baseSlug = `${baseSlug}-${uniquePart}`;
  }
  
  // Limit total length to 100 characters for SEO and URL readability
  if (baseSlug.length > 100) {
    const maxLength = uniqueId ? 94 : 100; // Reserve 6 chars for unique ID if needed
    const targetLength = maxLength - (uniqueId ? 7 : 0); // -7 for "-" + 6 char ID
    
    // Calculate proportional lengths
    const totalLength = pgSlug.length + ownerSlug.length + areaSlug.length + citySlug.length;
    const scale = targetLength / totalLength;
    
    // Truncate each part proportionally, with minimum lengths
    const truncatedPg = pgSlug.substring(0, Math.max(15, Math.floor(pgSlug.length * scale)));
    const truncatedOwner = ownerSlug.substring(0, Math.max(8, Math.floor(ownerSlug.length * scale)));
    const truncatedArea = areaSlug.substring(0, Math.max(8, Math.floor(areaSlug.length * scale)));
    const truncatedCity = citySlug.substring(0, Math.max(6, Math.floor(citySlug.length * scale)));
    
    let truncatedSlug = `${truncatedPg}-${truncatedOwner}-${truncatedArea}-${truncatedCity}`;
    
    if (uniqueId) {
      truncatedSlug = `${truncatedSlug}-${uniqueId.slice(-6).toLowerCase()}`;
    }
    
    return truncatedSlug.replace(/-+/g, "-").replace(/^-+|-+$/g, "");
  }
  
  return baseSlug.replace(/-+/g, "-").replace(/^-+|-+$/g, "");
}


