import express from "express";
import ActivityLog from "./activityLog.model.js";

const router = express.Router();

router.get("/:rfqId", async (req, res, next) => {
  try {
    const logs = await ActivityLog.find({ rfqId: req.params.rfqId })
      .sort({ createdAt: -1 });

    res.json({ data: logs });
  } catch (err) {
    next(err);
  }
});

export default router;