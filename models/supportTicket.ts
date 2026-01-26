// models/supportTicket.ts
import mongoose from "mongoose";

const ticketCommentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  userRole: {
    type: String,
    enum: ["user", "owner", "admin", "support"],
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  attachments: [
    {
      url: { type: String },
      name: { type: String },
      type: { type: String },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const supportTicketSchema = new mongoose.Schema(
  {
    // Ticket ID (human readable) - Remove required, let pre-save handle it
    ticketNumber: {
      type: String,
      unique: true,
      // required: true, // REMOVE THIS - pre-save hook will generate it
    },

    // User who raised the ticket
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Related booking (optional)
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },

    // Related listing (optional)
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      default: null,
    },

    // Ticket category
    category: {
      type: String,
      enum: [
        "maintenance",
        "food_complaint",
        "cleanliness",
        "security",
        "noise_complaint",
        "roommate_issue",
        "billing_payment",
        "wifi_internet",
        "water_electricity",
        "furniture_appliance",
        "booking_issue",
        "refund_request",
        "general_inquiry",
        "suggestion",
        "other",
      ],
      required: true,
    },

    // Priority level
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    // Ticket subject
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    // Ticket description
    description: {
      type: String,
      required: true,
      trim: true,
    },

    // Attachments (images, documents)
    attachments: [
      {
        url: { type: String, required: true },
        name: { type: String, required: true },
        type: { type: String, required: true },
      },
    ],

    // Ticket status
    status: {
      type: String,
      enum: ["open", "in_progress", "waiting_response", "resolved", "closed", "reopened"],
      default: "open",
    },

    // Assigned to (owner or admin)
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    assignedToRole: {
      type: String,
      enum: ["owner", "admin", "support"],
      default: null,
    },

    // Comments/Responses
    comments: [ticketCommentSchema],

    // Resolution details
    resolution: {
      type: String,
      default: "",
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // User satisfaction rating (after resolution)
    satisfactionRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },

    satisfactionFeedback: {
      type: String,
      default: "",
    },

    // Escalation
    isEscalated: {
      type: Boolean,
      default: false,
    },

    escalatedAt: {
      type: Date,
      default: null,
    },

    escalationReason: {
      type: String,
      default: "",
    },

    // Expected resolution time based on priority
    expectedResolutionDate: {
      type: Date,
      default: null,
    },

    // First response time tracking
    firstResponseAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries - REMOVE duplicate ticketNumber index
supportTicketSchema.index({ userId: 1, status: 1, createdAt: -1 });
supportTicketSchema.index({ listingId: 1, status: 1 });
supportTicketSchema.index({ assignedTo: 1, status: 1 });
// supportTicketSchema.index({ ticketNumber: 1 }, { unique: true }); // REMOVE - already has unique: true in schema
supportTicketSchema.index({ category: 1, status: 1 });
supportTicketSchema.index({ priority: 1, status: 1, createdAt: -1 });

// Generate ticket number before validation using pre-validate hook
supportTicketSchema.pre("validate", async function (next) {
  if (!this.ticketNumber) {
    try {
      // Use a more robust method to generate unique ticket number
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      
      // Get the last ticket number for today
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      
      const lastTicket = await mongoose.models.SupportTicket.findOne({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      }).sort({ createdAt: -1 }).select('ticketNumber');
      
      let sequence = 1;
      if (lastTicket?.ticketNumber) {
        // Extract sequence from last ticket number (e.g., TKT2501150001 -> 0001)
        const lastSequence = parseInt(lastTicket.ticketNumber.slice(-4), 10);
        sequence = lastSequence + 1;
      }
      
      this.ticketNumber = `TKT${year}${month}${day}${sequence.toString().padStart(4, "0")}`;
    } catch (error) {
      // Fallback to timestamp-based unique ID
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      this.ticketNumber = `TKT-${timestamp}-${random}`;
    }
  }
  next();
});

// Set expected resolution date based on priority
supportTicketSchema.pre("save", function (next) {
  // Set expected resolution date based on priority
  if (!this.expectedResolutionDate) {
    const now = new Date();
    switch (this.priority) {
      case "urgent":
        this.expectedResolutionDate = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours
        break;
      case "high":
        this.expectedResolutionDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
        break;
      case "medium":
        this.expectedResolutionDate = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours
        break;
      case "low":
        this.expectedResolutionDate = new Date(now.getTime() + 72 * 60 * 60 * 1000); // 72 hours
        break;
    }
  }
  next();
});

const SupportTicket =
  mongoose.models.SupportTicket ||
  mongoose.model("SupportTicket", supportTicketSchema);

export default SupportTicket;