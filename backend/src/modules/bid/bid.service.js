import Bid from "./bid.model.js";
import RFQ from "../rfq/rfq.model.js";
import { handleNewBid } from "../auction/auction.service.js";

export const submitBidService = async (data, user) => {

  // Ensure only suppliers can place bids
  if (user.role !== "supplier") {
    const error = new Error("Only suppliers can place bids");
    error.statusCode = 403;
    throw error;
  }

  const {
    rfqId,
    carrierName,
    freightCharges,
    originCharges,
    destinationCharges,
    transitTime,
    validityOfQuote,
  } = data;

  if (
    !rfqId ||
    !carrierName ||
    freightCharges == null ||
    originCharges == null ||
    destinationCharges == null ||
    !transitTime ||
    !validityOfQuote
  ) {
    const error = new Error("All bid fields are required");
    error.statusCode = 400;
    throw error;
  }

  if (
    freightCharges < 0 ||
    originCharges < 0 ||
    destinationCharges < 0
  ) {
    const error = new Error("Charges cannot be negative");
    error.statusCode = 400;
    throw error;
  }

  const totalBidAmount =
    Number(freightCharges) +
    Number(originCharges) +
    Number(destinationCharges);

  if (isNaN(totalBidAmount)) {
    const error = new Error("Invalid numeric values in bid");
    error.statusCode = 400;
    throw error;
  }

  const rfq = await RFQ.findById(rfqId);
  if (!rfq) {
    const error = new Error("RFQ not found");
    error.statusCode = 404;
    throw error;
  }

  const now = new Date();

  if (now < rfq.bidStartTime) {
    const error = new Error("Auction not started yet");
    error.statusCode = 400;
    throw error;
  }

  if (now > rfq.bidCloseTime) {
    const error = new Error("Auction already closed");
    error.statusCode = 400;
    throw error;
  }

  if (now > rfq.forcedBidCloseTime) {
    const error = new Error("Auction force closed");
    error.statusCode = 400;
    throw error;
  }

  const lastBid = await Bid.findOne({
    rfqId,
    supplierId: user.userId,
  }).sort({ createdAt: -1 });

  // Enforce that new bids must be lower than previous bids from same supplier
  if (lastBid && totalBidAmount >= lastBid.totalBidAmount) {
    const error = new Error(
      "New bid must be lower than your previous bid"
    );
    error.statusCode = 400;
    throw error;
  }

  const bidPayload = {
    rfqId,
    supplierId: user.userId,
    carrierName,
    freightCharges,
    originCharges,
    destinationCharges,
    totalBidAmount,
    transitTime,
    validityOfQuote,
  };

  // Delegate auction logic (ranking, extension) to auction engine
  return await handleNewBid(rfqId, bidPayload);
};