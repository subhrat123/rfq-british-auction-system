import express from "express";
import {
  createRFQController,
  getRFQsController,
  getRFQController,
  getRFQDetailsController,
} from "./rfq.controller.js";

import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { roleMiddleware } from "../../middlewares/roleMiddleware.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  roleMiddleware(["buyer"]),
  createRFQController
);

router.get("/", getRFQsController);
router.get("/:id", getRFQController);
router.get("/:id/details", getRFQDetailsController);

export default router;