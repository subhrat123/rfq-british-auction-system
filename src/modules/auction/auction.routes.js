import express from "express";
import { createAuctionConfig } from "./auction.controller.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { roleMiddleware } from "../../middlewares/roleMiddleware.js";

const router = express.Router();

// Only buyer should configure auction
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["buyer"]),
  createAuctionConfig
);

export default router;