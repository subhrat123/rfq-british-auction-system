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
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
    currentBidCloseTime:{
      type: Date,
      required: true,
    },
    forcedBidCloseTime: {
      type: Date,
      required: true,
    },
    
    currentLowestBidId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bid",
      default: null,
    },

    currentLowestBidAmount: {
      type: Number,
      default: null,
    },

    currentLowestBidSupplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

  },
  { timestamps: true }
);

export default mongoose.model("RFQ", rfqSchema);