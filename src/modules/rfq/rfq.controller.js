import {
  createRFQService,
  getAllRFQsService,
  getRFQByIdService,
} from "./rfq.service.js";

export const createRFQController = async (req, res, next) => {
  try {
    const rfq = await createRFQService(req.body, req.user);

    res.status(201).json({
      message: "RFQ created successfully",
      data: rfq,
    });
  } catch (err) {
    next(err);
  }
};

export const getRFQsController = async (req, res, next) => {
  try {
    const rfqs = await getAllRFQsService();

    res.status(200).json({
      message: "RFQs fetched successfully",
      data: rfqs,
    });
  } catch (err) {
    next(err);
  }
};

export const getRFQController = async (req, res, next) => {
  try {
    const rfq = await getRFQByIdService(req.params.id);

    if (!rfq) {
      return next(new Error("RFQ not found"));
    }

    res.status(200).json({
      message: "RFQ fetched successfully",
      data: rfq,
    });
  } catch (err) {
    next(err);
  }
};