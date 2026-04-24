import mongoose from "mongoose";

const rfqSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    referenceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    pickupDate: {
      type: Date,
      required: true,
    },
    bidStartTime: {
      type: Date,
      required: true,
    },
    bidCloseTime: {
      type: Date,
      required: true,
    },
    forcedBidCloseTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["upcoming", "active", "closed", "force_closed"],
      default: "upcoming",
      index: true,
    },
    currentLowestBid: {
      type: Number,
      default: null,
    },
    currentLowestSupplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("RFQ", rfqSchema);