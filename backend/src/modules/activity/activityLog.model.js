import mongoose from "mongoose";

// Tracks all auction events (bids, extensions) for transparency and audit
const activitySchema = new mongoose.Schema(
  {
    rfqId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RFQ",
      required: true,
      index: true,
    },

    eventType: {
      type: String,
      enum: ["bid_submitted", "time_extended", "auction_closed"],
      required: true,
    },

    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    bidId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bid",
    },

    message: String,
    reason: String,

    previousCloseTime: Date,
    newCloseTime: Date,
  },
  { timestamps: true }
);

export default mongoose.model("ActivityLog", activitySchema);