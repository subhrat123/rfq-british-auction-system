import RFQ from "./rfq.model.js";
import Bid from "../bid/bid.model.js";
import ActivityLog from "../activity/activity.model.js";
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

    // Ensure auction timing is logically valid (start < close < forced close)
    if (new Date(bidStartTime) >= new Date(bidCloseTime)) {
        const error = new Error("Bid start time must be before bid close time");
        error.statusCode = 400;
        throw error;
    }

    if (new Date(data.forcedBidCloseTime) <= new Date(data.bidCloseTime)) {
        const error = new Error("Forced close time must be greater than bid close time");
        error.statusCode = 400;
        throw error;
    }

    const rfq = await RFQ.create({
        ...data,
        buyerId: user.userId,
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
    .sort({ rank: 1 });

  const logs = await ActivityLog.find({ rfqId }).sort({ createdAt: -1 });

  const config = await AuctionConfig.findOne({ rfqId });

  return { rfq, bids, logs, config };
};