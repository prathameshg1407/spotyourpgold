import mongoose, { Schema, Document } from "mongoose";

export interface INotificationLog extends Document {
  userId?: mongoose.Types.ObjectId;
  phoneNumber: string;
  templateName: string;
  templateParams: any[];
  status: "success" | "failed" | "pending";
  response?: any;
  error?: any;
  retryCount?: number;
  messageId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const notificationLogSchema = new Schema<INotificationLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    templateName: {
      type: String,
      required: true,
      trim: true,
    },
    templateParams: {
      type: Schema.Types.Mixed,
      default: [],
    },
    status: {
      type: String,
      enum: ["success", "failed", "pending"],
      default: "pending",
      required: true,
    },
    response: {
      type: Schema.Types.Mixed,
      required: false,
    },
    error: {
      type: Schema.Types.Mixed,
      required: false,
    },
    retryCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    messageId: {
      type: String,
      required: false,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
notificationLogSchema.index({ userId: 1, createdAt: -1 });
notificationLogSchema.index({ phoneNumber: 1, createdAt: -1 });
notificationLogSchema.index({ status: 1, createdAt: -1 });
notificationLogSchema.index({ templateName: 1, createdAt: -1 });
notificationLogSchema.index({ createdAt: -1 });
notificationLogSchema.index({ messageId: 1 }, { sparse: true });

// Virtual for formatted date
notificationLogSchema.virtual("formattedDate").get(function (this: INotificationLog) {
  return this.createdAt.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
});

// Method to check if notification is successful
notificationLogSchema.methods.isSuccessful = function () {
  return this.status === "success";
};

// Static method to get success rate
notificationLogSchema.statics.getSuccessRate = async function (
  filter: any = {}
) {
  const total = await this.countDocuments(filter);
  const successful = await this.countDocuments({ ...filter, status: "success" });
  
  return total > 0 ? (successful / total) * 100 : 0;
};

// Static method to get statistics
notificationLogSchema.statics.getStatistics = async function (
  startDate?: Date,
  endDate?: Date
) {
  const matchStage: any = {};
  
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = startDate;
    if (endDate) matchStage.createdAt.$lte = endDate;
  }

  const stats = await this.aggregate([
    ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        avgRetryCount: { $avg: "$retryCount" },
      },
    },
  ]);

  const templateStats = await this.aggregate([
    ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
    {
      $group: {
        _id: "$templateName",
        count: { $sum: 1 },
        successCount: {
          $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        templateName: "$_id",
        count: 1,
        successCount: 1,
        successRate: {
          $multiply: [{ $divide: ["$successCount", "$count"] }, 100],
        },
      },
    },
    { $sort: { count: -1 } },
  ]);

  return {
    statusBreakdown: stats,
    templateBreakdown: templateStats,
  };
};

const NotificationLog =
  (mongoose.models.NotificationLog as mongoose.Model<INotificationLog>) ||
  mongoose.model<INotificationLog>("NotificationLog", notificationLogSchema);

export default NotificationLog;