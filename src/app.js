import express from "express";
import cors from "cors";
import errorHandler from "./middlewares/errorHandler.js";

import authRoutes from "./modules/auth/auth.routes.js";
import rfqRoutes from "./modules/rfq/rfq.routes.js";
import bidRoutes from "./modules/bid/bid.routes.js";
import activityRoutes from "./modules/activity/activity.routes.js"
import auctionRoutes from "./modules/auction/auction.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/rfqs", rfqRoutes);
app.use("/api/v1/bids", bidRoutes);
app.use("/api/v1/activity", activityRoutes);
app.use("/api/v1/auction-config", auctionRoutes);

app.use(errorHandler);

export default app;