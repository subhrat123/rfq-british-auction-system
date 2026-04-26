import AuctionConfig from "./auctionConfig.model.js";
import RFQ from "../rfq/rfq.model.js";

export const createAuctionConfig = async (req, res, next) => {
  try {
    const {
      rfqId,
      triggerWindowMinutes,
      extensionDurationMinutes,
      triggerType,
    } = req.body;

    // Required fields validation
    if (
      !rfqId ||
      triggerWindowMinutes == null ||
      extensionDurationMinutes == null ||
      !triggerType
    ) {
      const error = new Error("All fields are required");
      error.statusCode = 400;
      throw error;
    }

    const allowedTypes = [
      "bid_received",
      "any_rank_change",
      "l1_rank_change",
    ];

    if (!allowedTypes.includes(triggerType)) {
      const error = new Error("Invalid trigger type");
      error.statusCode = 400;
      throw error;
    }

    const rfq = await RFQ.findById(rfqId);
    if (!rfq) {
      const error = new Error("RFQ not found");
      error.statusCode = 404;
      throw error;
    }

    // Prevent duplicate config 
    const existing = await AuctionConfig.findOne({ rfqId });
    if (existing) {
      const error = new Error("Auction config already exists for this RFQ");
      error.statusCode = 400;
      throw error;
    }

    const config = await AuctionConfig.create({
      rfqId,
      triggerWindowMinutes,
      extensionDurationMinutes,
      triggerType,
    });

    res.status(201).json({
      message: "Auction config created",
      data: config,
    });
  } catch (err) {
    next(err);
  }
};