import mongoose, { Schema, model, models } from "mongoose";

const reviewSchema = new Schema(
  {
    listingId: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

// Prevent duplicate reviews per user per listing
reviewSchema.index({ listingId: 1, userId: 1 }, { unique: true });

const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema);

export default Review;
