import { submitBidService } from "./bid.service.js";
import { getIO } from "../../socket/socket.js";

export const submitBidController = async (req, res, next) => {
  try {
    const result = await submitBidService(req.body, req.user);

    const io = getIO();

    io.to(`auction:${result.bid.rfqId}`).emit("BID_ACCEPTED", {
        bid: result.bid,
        auctionState: result.auctionState,
        activities: result.activities,
    });

    res.status(201).json({
        success: true,
        data: result,
    });
  } catch (err) {
    next(err);
  }
};