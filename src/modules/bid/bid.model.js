import mongoose from "mongoose";

const bidSchema = new mongoose.Schema(
  {
    rfqId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RFQ",
      required: true,
      index: true,
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
    },
    originCharges: {
      type: Number,
      required: true,
    },
    destinationCharges: {
      type: Number,
      required: true,
    },

    totalBidAmount: {
      type: Number,
      required: true,
      index: true,
    },

    transitTime: {
      type: Number,
      required: true,
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