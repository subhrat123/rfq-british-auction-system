import { submitBidService } from "./bid.service.js";

export const submitBidController = async (req, res, next) => {
  try {
    const bid = await submitBidService(req.body, req.user);

    res.status(201).json({
      message: "Bid submitted successfully",
      data: bid,
    });
  } catch (err) {
    next(err);
  }
};