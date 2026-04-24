import RFQ from "../rfq/rfq.model.js";
import Bid from "../bid/bid.model.js";
import AuctionConfig from "./auctionConfig.model.js";
import ActivityLog from "../activity/activity.model.js";

export const handleNewBid = async (rfqId, bidData) => {
  const rfq = await RFQ.findById(rfqId);
  if (!rfq) {
    const error = new Error("RFQ not found");
    error.statusCode = 404;
    throw error;
  }

  const config = await AuctionConfig.findOne({ rfqId });
  if (!config) {
    const error = new Error("Auction config not found");
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();

  if (now > rfq.forcedBidCloseTime) {
    const error = new Error("Auction force closed");
    error.statusCode = 400;
    throw error;
  }

  if (now > rfq.bidCloseTime) {
    const error = new Error("Auction already closed");
    error.statusCode = 400;
    throw error;
  }

  const previousBids = await Bid.find({ rfqId }).sort({ totalBidAmount: 1 });
  const previousL1 = previousBids[0]?.supplierId?.toString();

  const bid = await Bid.create(bidData);

  const bids = await Bid.find({ rfqId }).sort({ totalBidAmount: 1 });

  let rankChanged = false;
  let l1Changed = false;

  for (let i = 0; i < bids.length; i++) {
    if (bids[i].rank !== i + 1) rankChanged = true;

    bids[i].rank = i + 1;
    await bids[i].save();
  }

  const newL1 = bids[0]?.supplierId?.toString();
  if (previousL1 && previousL1 !== newL1) {
    l1Changed = true;
  }

  rfq.currentLowestBid = bids[0].totalBidAmount;
  rfq.currentLowestSupplier = bids[0].supplierId;

  const triggerTime = new Date(
    rfq.bidCloseTime.getTime() - config.triggerWindowMinutes * 60000
  );

  let shouldExtend = false;

  if (now >= triggerTime) {
    if (config.triggerType === "bid_received") {
      shouldExtend = true;
    } else if (config.triggerType === "any_rank_change" && rankChanged) {
      shouldExtend = true;
    } else if (config.triggerType === "l1_rank_change" && l1Changed) {
      shouldExtend = true;
    }
  }

  if (shouldExtend) {
    const prevClose = rfq.bidCloseTime;

    let newClose = new Date(
      rfq.bidCloseTime.getTime() +
        config.extensionDurationMinutes * 60000
    );

    if (newClose > rfq.forcedBidCloseTime) {
      newClose = rfq.forcedBidCloseTime;
    }

    rfq.bidCloseTime = newClose;

    await ActivityLog.create({
      rfqId,
      eventType: "time_extended",
      reason: config.triggerType,
      previousCloseTime: prevClose,
      newCloseTime: newClose,
      message: "Auction time extended",
    });
  }

  await ActivityLog.create({
    rfqId,
    eventType: "bid_submitted",
    message: "New bid submitted",
  });

  await rfq.save();

  return bid;
};