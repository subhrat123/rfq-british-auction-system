import mongoose from "mongoose";

// Stores configurable auction behavior (trigger window, extension duration, trigger type)
const auctionConfigSchema = new mongoose.Schema(
  {
    rfqId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RFQ",
      required: true,
      unique: true,
    },

    triggerWindowMinutes: {
      type: Number,
      required: true,
    },

    extensionDurationMinutes: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("AuctionConfig", auctionConfigSchema);