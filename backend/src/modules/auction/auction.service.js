import mongoose from "mongoose";
import RFQ from "../rfq/rfq.model.js";
import Bid from "../bid/bid.model.js";
import AuctionConfig from "./auctionConfig.model.js";
import ActivityLog from "../activity/activityLog.model.js";


// Handles bid submission with full auction logic:
// - trigger detection
// - auction extension
// - activity logging
// All operations are wrapped in a transaction for consistency


export const handleNewBid = async (rfqId, bidData) => {

  // Start transaction to ensure atomic updates across bid, RFQ, and logs
  const session = await mongoose.startSession();

  try {
    let result;
    const activities = [];

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

      if (now < rfq.bidStartTime) {
        const error = new Error("Auction has not started yet");
        error.statusCode = 400;
        throw error;
      }

      if (now >= rfq.currentBidCloseTime) {
        const error = new Error("Auction already closed");
        error.statusCode = 400;
        throw error;
      }

      if(rfq.currentLowestBidAmount !== null && bidData.totalBidAmount >= rfq.currentLowestBidAmount) {
        const error = new Error("Bid amount must be lower than current lowest bid");
        error.statusCode = 400;
        throw error;
      }

      const bidArr = await Bid.create([bidData], { session });
      const bid = bidArr[0];
      await bid.populate("supplierId", "name email");

      rfq.currentLowestBidId = bid._id
      rfq.currentLowestBidAmount = bid.totalBidAmount;
      rfq.currentLowestBidSupplierId = bid.supplierId;


      const triggerTime = new Date(
        rfq.currentBidCloseTime.getTime() -
        config.triggerWindowMinutes * 60000
      );

      // Apply extension only if configured trigger condition is satisfied
      if (now >= triggerTime) {
        const prevClose = rfq.currentBidCloseTime;

        let newClose = new Date(
          rfq.currentBidCloseTime.getTime() +
          config.extensionDurationMinutes * 60000
        );

        // Ensure auction never extends beyond forced close time
        if (newClose > rfq.forcedBidCloseTime) {
          newClose = rfq.forcedBidCloseTime;
        }

        if (newClose > prevClose) {
          rfq.currentBidCloseTime = newClose;
        }

        const extensionActivity = {
          eventType: "time_extended",
          reason: "Trigger window reached",
          previousCloseTime: prevClose,
          newCloseTime: newClose,
          message: "Auction time extended due to trigger",
        };

        // Log auction extension with reason and updated timing
        await ActivityLog.create(
          [{
            rfqId,
            ...extensionActivity
          }],
          { session }
        );
        activities.push(extensionActivity);
      }
      
     const bidActivity = {
      eventType: "bid_submitted",
      supplierId: bid.supplierId,
      bidId: bid._id,
      message: `New bid submitted: ₹${bid.totalBidAmount}`,
    };

      // Log every bid submission for audit trail
      await ActivityLog.create(
        [{
          rfqId,
          ...bidActivity,
        }],
        { session }
      );

      activities.push(bidActivity);

      await rfq.save({ session });

      result = {
        bid,
        auctionState: {
          currentLowestBidId: rfq.currentLowestBidId,
          currentLowestBidAmount: rfq.currentLowestBidAmount,
          currentLowestBidSupplierId: rfq.currentLowestBidSupplierId,
          currentBidCloseTime: rfq.currentBidCloseTime,
        },
        activities,
      };
    });

    return result;

  } finally {
    session.endSession();
  }
};