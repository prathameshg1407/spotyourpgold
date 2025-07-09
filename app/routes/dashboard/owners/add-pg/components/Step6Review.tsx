"use client";

import type React from "react";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { BlurImage } from "@/components/BlurImage";
import type { PGFormData } from "../types";
import { predefinedAmenities } from "../constants";

interface Step6ReviewProps {
  formData: PGFormData;
  isEditMode?: boolean;
}

export const Step6Review: React.FC<Step6ReviewProps> = ({
  formData,
  isEditMode,
}) => {
  return (
    <form>
      <div className="space-y-8 text-left pb-10 font-inter">
        {/* ✅ Basic Info */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { type: "spring", stiffness: 300, damping: 24 },
            },
          }}
          className="space-y-4"
        >
          <h3 className="text-lg font-semibold text-HG-500">Basic Information</h3>
          <div className="text-sm text-gray-700 flex justify-between items-center">
            <p><strong>Name:</strong> {formData.pgName}</p>
            <p><strong>Gender Preference:</strong> {formData.genderPreference}</p>
          </div>

          {formData.roomTypes?.length > 0 && (
            <div className="pt-4 space-y-2">
              <h4 className="font-medium text-HG-500">Room Types</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-700">
                {formData.roomTypes?.map((room, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-3">
                    <p><strong>Type:</strong> {room.type}</p>
                    <p><strong>Rooms:</strong> {room.numberOfRooms}</p>
                    <p><strong>Capacity/Room:</strong> {room.capacityPerRoom}</p>
                    <p><strong>Monthly Rent:</strong> ₹{room.monthlyRent.toLocaleString()}</p>
                    <p><strong>Security Deposit:</strong> ₹{room.securityDeposit.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* ✅ Location */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { type: "spring", stiffness: 300, damping: 24 },
            },
          }}
          className="space-y-4"
        >
          <h3 className="text-lg font-semibold text-HG-500">Location</h3>
          <div className="grid grid-cols-2 text-xs md:grid-cols-2 gap-4 md:text-sm text-gray-700">
            <p><strong>Area:</strong> {formData.location.area}</p>
            <p><strong>City:</strong> {formData.location.city}</p>
            <p><strong>State:</strong> {formData.location.state}</p>
            <p><strong>Pincode:</strong> {formData.location.pincode}</p>
            {/* {formData.location.coordinates && (
              <p>
                <strong>Coordinates:</strong>{" "}
                {formData.location.coordinates.lat.toFixed(4)},{" "}
                {formData.location.coordinates.lng.toFixed(4)}
              </p>
            )} */}
          </div>
        </motion.div>

        {/* ✅ Images */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { type: "spring", stiffness: 300, damping: 24 },
            },
          }}
          className="space-y-2"
        >
          <h3 className="text-lg font-semibold text-HG-500">Uploaded Images</h3>
          <div className="text-sm text-gray-700 overflow-hidden">
            {formData.existingImageUrls?.length > 0 || formData.images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {formData.existingImageUrls?.map((img, idx) => (
                  <BlurImage
                    key={`existing-${idx}`}
                    src={img}
                    alt={`Image ${idx + 1}`}
                    className="w-full h-32 border object-cover rounded-lg"
                    width={400}
                    height={400}
                  />
                ))}
                {formData.images.map((file, idx) => (
                  <BlurImage
                    key={`new-${idx}`}
                    src={URL.createObjectURL(file)}
                    alt={`Image ${idx + 1}`}
                    className="w-full h-32 border object-cover rounded-lg"
                    width={400}
                    height={400}
                  />
                ))}
              </div>
            ) : (
              <p>No images uploaded</p>
            )}
          </div>
        </motion.div>

        {/* ✅ Amenities */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { type: "spring", stiffness: 300, damping: 24 },
            },
          }}
          className="space-y-2"
        >
          <h3 className="text-lg font-semibold text-HG-500">Amenities</h3>
          <div className="flex flex-wrap gap-2 text-sm">
            {formData.amenities?.map((id, idx) => {
              const label = predefinedAmenities.find((a) => a.id === id)?.label || id;
              return (
                <span
                  key={idx}
                  className="bg-HG-50 border text-HG-500 border-HG-200 rounded-full px-3 py-1"
                >
                  {label}
                </span>
              );
            })}
          </div>
        </motion.div>

        {/* ✅ Additional Details */}
        {formData.additionalDetails?.length > 0 && (
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { type: "spring", stiffness: 300, damping: 24 },
              },
            }}
            className="space-y-2"
          >
            <h3 className="text-lg font-semibold text-HG-500">Additional Details</h3>
            <ul className="text-sm text-gray-700 list-disc list-inside">
              {formData.additionalDetails?.map((detail, idx) => (
                <li key={idx}>{detail}</li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* ✅ Rent Inclusions */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { type: "spring", stiffness: 300, damping: 24 },
            },
          }}
          className="space-y-2"
        >
          <h3 className="text-lg font-semibold text-HG-500">Included in Rent</h3>
          <div className="flex flex-wrap gap-4 text-sm text-gray-700">
            {formData.foodIncluded && <span>🍱 Food/Meals</span>}
            {formData.electricityIncluded && <span>⚡ Electricity</span>}
            {formData.maintenanceIncluded && <span>🧹 Maintenance</span>}
            {!formData.foodIncluded && !formData.electricityIncluded && !formData.maintenanceIncluded && (
              <span className="text-gray-400">None selected</span>
            )}
          </div>
        </motion.div>

        {/* ✅ Rules */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { type: "spring", stiffness: 300, damping: 24 },
            },
          }}
          className="space-y-2"
        >
          <h3 className="text-lg font-semibold text-HG-500">Rules & Regulations</h3>
          {formData.rulesAndRegulations?.length > 0 ? (
            <ul className="text-sm text-gray-700 list-disc list-inside">
              {formData.rulesAndRegulations?.map((rule, idx) => (
                <li key={idx}>{rule}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No rules provided</p>
          )}
        </motion.div>

        {/* ✅ Payment Info */}
        {!isEditMode && (
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { type: "spring", stiffness: 300, damping: 24 },
              },
            }}
            className="bg-yellow-50 p-4 rounded-lg border border-yellow-200"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-800">Listing Fee Required</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  A listing fee of ₹299 is required to publish your PG. You can pay now or submit with fee pending.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </form>
  );
};
