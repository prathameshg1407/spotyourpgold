"use client";

import React from "react";
import PgCard from "./PgCard";

type OwnerListingSectionProps = {
  listings: any[];
  loading: boolean;
  ownerName: string;
};

const OwnerListingSection = ({
  listings,
  loading,
  ownerName,
}: OwnerListingSectionProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="w-full max-w-[320px] mx-auto animate-pulse"
          >
            <div className="border-4 border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-300 h-44 w-full"></div>
              <div className="p-4 bg-white">
                <div className="bg-gray-300 h-3 rounded mb-2 w-1/2"></div>
                <div className="bg-gray-300 h-5 rounded mb-2"></div>
                <div className="bg-gray-300 h-4 rounded mb-4 w-3/4"></div>
                <div className="bg-gray-300 h-6 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!listings || listings.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">
          No other properties available from {ownerName}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
      {listings.slice(0, 4).map((listing) => (
        <PgCard
          key={listing._id}
          id={listing._id}
          image={listing.primaryImage || listing.images?.[0]?.url}
          images={listing.images?.map((img: any) => img.url) || []}
          area={listing.location?.area || listing.location?.city}
          pgName={listing.pgName}
          ownerName={listing.ownerId?.fullName}
          price={
            listing.minRent && listing.minRent !== Infinity
              ? listing.minRent
              : listing.monthlyRent
          }
          genderPreference={listing.genderPreference}
          isWishlisted={listing.isWatchlisted || listing.inWatchList}
          type={listing.type}
        />
      ))}
    </div>
  );
};

export default OwnerListingSection;
