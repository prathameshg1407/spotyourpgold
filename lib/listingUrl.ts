/**
 * Helper function to generate the URL path for a listing
 * Uses slug if available, otherwise falls back to ID
 */
export function getListingUrl(listing: { slug?: string; _id: string }): string {
  return `/routes/pg-details/${listing.slug || listing._id}`;
}


