/**
 * Helper function to generate the URL path for a listing
 * Uses slug if available, otherwise falls back to ID
 */

export function getListingUrl({ slug, _id }: { slug?: string; _id: string }) {
  // Prioritize slug over _id
  if (slug && slug.trim()) {
    return `/routes/pg-details/${slug}`;
  }
  return `/routes/pg-details/${_id}`;
}


