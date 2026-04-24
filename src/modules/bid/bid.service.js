import Bid from "./bid.model.js";
import RFQ from "../rfq/rfq.model.js";

export const submitBidService = async (data, user) => {

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

  const totalBidAmount =
    Number(freightCharges) +
    Number(originCharges) +
    Number(destinationCharges);

  const lastBid = await Bid.findOne({
    rfqId,
    supplierId: user.userId,
  }).sort({ createdAt: -1 });

  if (lastBid && totalBidAmount >= lastBid.totalBidAmount) {
    const error = new Error(
      "New bid must be lower than your previous bid"
    );
    error.statusCode = 400;
    throw error;
  }


  const bid = await Bid.create({
    rfqId,
    supplierId: user.userId,
    carrierName,
    freightCharges,
    originCharges,
    destinationCharges,
    totalBidAmount,
    transitTime,
    validityOfQuote,
  });

  return bid;
};