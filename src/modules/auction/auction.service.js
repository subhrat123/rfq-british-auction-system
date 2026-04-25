import mongoose from "mongoose";
import RFQ from "../rfq/rfq.model.js";
import Bid from "../bid/bid.model.js";
import AuctionConfig from "./auctionConfig.model.js";
import ActivityLog from "../activity/activity.model.js";


// Handles bid submission with full auction logic:
// - ranking recalculation
// - trigger detection
// - auction extension
// - activity logging
// All operations are wrapped in a transaction for consistency


export const handleNewBid = async (rfqId, bidData) => {

  // Start transaction to ensure atomic updates across bid, RFQ, and logs
  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      const rfq = await RFQ.findById(rfqId).session(session);
      if (!rfq) {
        const error = new Error("RFQ not found");
        error.statusCode = 404;
        throw error;
      }

      const config = await AuctionConfig.findOne({ rfqId }).session(session);
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

      const previousBids = await Bid.find({ rfqId })
        .sort({ totalBidAmount: 1 })
        .session(session);

      // Capture previous ranking state to detect rank changes
      const previousRanks = previousBids.map((b, i) => ({
        id: b._id.toString(),
        rank: i + 1,
      }));

      const previousL1 = previousBids[0]?.supplierId?.toString();

      const bidArr = await Bid.create([bidData], { session });
      const bid = bidArr[0];

      // Recalculate ranks since new bid can change global ordering
      const bids = await Bid.find({ rfqId })
        .sort({ totalBidAmount: 1 })
        .session(session);

      let rankChanged = false;

      const bulkOps = bids.map((b, index) => {
        const prev = previousRanks.find(p => p.id === b._id.toString());

        // Detect if any rank has changed after inserting new bid
        if (!prev || prev.rank !== index + 1) {
          rankChanged = true;
        }

        return {
          updateOne: {
            filter: { _id: b._id },
            update: { rank: index + 1 },
          },
        };
      });

      if (bulkOps.length) {
        await Bid.bulkWrite(bulkOps, { session });
      }

      // Detect if lowest bidder (L1) has changed
      const newL1 = bids[0]?.supplierId?.toString();
      const l1Changed = previousL1 && previousL1 !== newL1;

      if (bids.length > 0) {
        rfq.currentLowestBid = bids[0].totalBidAmount;
        rfq.currentLowestSupplier = bids[0].supplierId;
      }

      // Check if current time falls within trigger window before extending auction
      const triggerTime = new Date(
        rfq.bidCloseTime.getTime() -
        config.triggerWindowMinutes * 60000
      );

      let shouldExtend = false;

      // Apply extension only if configured trigger condition is satisfied
      if (now >= triggerTime) {
        if (config.triggerType === "bid_received") {
          shouldExtend = true;
        } else if (
          config.triggerType === "any_rank_change" &&
          rankChanged
        ) {
          shouldExtend = true;
        } else if (
          config.triggerType === "l1_rank_change" &&
          l1Changed
        ) {
          shouldExtend = true;
        }
      }

      if (shouldExtend) {
        const prevClose = rfq.bidCloseTime;

        let newClose = new Date(
          rfq.bidCloseTime.getTime() +
          config.extensionDurationMinutes * 60000
        );

        // Ensure auction never extends beyond forced close time
        if (newClose > rfq.forcedBidCloseTime) {
          newClose = rfq.forcedBidCloseTime;
        }

        rfq.bidCloseTime = newClose;

        // Log auction extension with reason and updated timing
        await ActivityLog.create(
          [{
            rfqId,
            eventType: "time_extended",
            reason: config.triggerType,
            previousCloseTime: prevClose,
            newCloseTime: newClose,
            message: "Auction time extended due to trigger",
          }],
          { session }
        );
      }

      // Log every bid submission for audit trail
      await ActivityLog.create(
        [{
          rfqId,
          eventType: "bid_submitted",
          message: "New bid submitted",
        }],
        { session }
      );

      await rfq.save({ session });

      result = bid;
    });

    return result;

  } finally {
    session.endSession();
  }
};