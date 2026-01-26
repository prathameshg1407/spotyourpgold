// models/moveInChecklist.ts
import mongoose from "mongoose";

const checklistItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  category: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  required: { type: Boolean, default: false },
  completed: { type: Boolean, default: false },
});

const moveInChecklistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    items: [checklistItemSchema],
    completionPercentage: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
moveInChecklistSchema.index({ userId: 1, bookingId: 1 }, { unique: true });

const MoveInChecklist =
  mongoose.models.MoveInChecklist ||
  mongoose.model("MoveInChecklist", moveInChecklistSchema);

export default MoveInChecklist;