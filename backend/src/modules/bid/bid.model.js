import mongoose from "mongoose";

// Each bid represents a supplier's offer in an RFQ auction
// Multiple bids per supplier are allowed (append-only design)
const bidSchema = new mongoose.Schema(
  {
    rfqId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RFQ",
      required: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    carrierName: {
      type: String,
      required: true,
      trim: true,
    },

    freightCharges: {
      type: Number,
      required: true,
      min: [0, "Freight charges cannot be negative"],
    },
    originCharges: {
      type: Number,
      required: true,
      min: [0, "Origin charges cannot be negative"],
    },
    destinationCharges: {
      type: Number,
      required: true,
      min: [0, "Destination charges cannot be negative"],
    },

    totalBidAmount: {
      type: Number,
      required: true,
    },

    transitTime: {
      type: Number,
      required: true,
      min: [0, "Transit time cannot be negative"],
    },

    validityOfQuote: {
      type: Date,
      required: true,
    },

    rank: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

bidSchema.index({ rfqId: 1, totalBidAmount: 1 });

export default mongoose.model("Bid", bidSchema);