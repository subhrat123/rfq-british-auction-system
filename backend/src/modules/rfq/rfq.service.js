import RFQ from "./rfq.model.js";
import Bid from "../bid/bid.model.js";
import ActivityLog from "../activity/activityLog.model.js";
import AuctionConfig from "../auction/auctionConfig.model.js";

export const createRFQService = async (data, user) => {

    if (user.role !== "buyer") {
        const error = new Error("Only buyers can create RFQs");
        error.statusCode = 403;
        throw error;
    }

    const {
        name,
        referenceId,
        bidStartTime,
        bidCloseTime,
        forcedBidCloseTime,
        pickupDate,
    } = data;

    // Required fields validation
    if (
        !name ||
        !referenceId ||
        !bidStartTime ||
        !bidCloseTime ||
        !forcedBidCloseTime ||
        !pickupDate
    ) {
        const error = new Error("All required fields must be provided");
        error.statusCode = 400;
        throw error;
    }

    const start = new Date(bidStartTime);
    const close = new Date(bidCloseTime);
    const forcedClose = new Date(forcedBidCloseTime);
    const now = new Date();

    if (start >= close) {
        const error = new Error("Bid start time must be before bid close time");
        error.statusCode = 400;
        throw error;
    }

    if (forcedClose <= close) {
        const error = new Error("Forced close time must be greater than bid close time");
        error.statusCode = 400;
        throw error;
    }

    const existing = await RFQ.findOne({ referenceId });
    if (existing) {
        const error = new Error("RFQ with this referenceId already exists");
        error.statusCode = 400;
        throw error;
    }

    const rfq = await RFQ.create({
        ...data,
        buyerId: user.userId,
        currentBidCloseTime: close
    });

    return rfq;
};

export const getAllRFQsService = async () => {
    return RFQ.find()
        .populate("buyerId", "name email")
        .sort({ createdAt: -1 });
};

export const getRFQByIdService = async (id) => {
    return RFQ.findById(id).populate("buyerId", "name email");
};

export const getRFQDetailsService = async (rfqId) => {
  const rfq = await RFQ.findById(rfqId).populate("buyerId", "name email");

  if (!rfq) {
    const error = new Error("RFQ not found");
    error.statusCode = 404;
    throw error;
  }

  const bids = await Bid.find({ rfqId })
    .populate("supplierId", "name email")
    .sort({ createdAt: -1 });

  const logs = await ActivityLog.find({ rfqId }).sort({ createdAt: -1 });

  const config = await AuctionConfig.findOne({ rfqId });

  return { rfq, bids, logs, config };
};