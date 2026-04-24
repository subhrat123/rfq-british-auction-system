import {
  createRFQService,
  getAllRFQsService,
  getRFQByIdService,
} from "./rfq.service.js";

export const createRFQController = async (req, res) => {
  try {
    const rfq = await createRFQService(req.body, req.user);

    res.status(201).json({
      message: "RFQ created successfully",
      data: rfq,
    });
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
};

export const getRFQsController = async (req, res) => {
  try {
    const rfqs = await getAllRFQsService();

    res.status(200).json({
      message: "RFQs fetched successfully",
      data: rfqs,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

export const getRFQController = async (req, res) => {
  try {
    const rfq = await getRFQByIdService(req.params.id);

    if (!rfq) {
      return res.status(404).json({
        message: "RFQ not found",
      });
    }

    res.status(200).json({
      message: "RFQ fetched successfully",
      data: rfq,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};