import RFQ from "./rfq.model.js";

export const createRFQService = async (data, user) => {
  if (user.role !== "buyer") {
    throw new Error("Only buyers can create RFQs");
  }

  if (new Date(data.forcedBidCloseTime) <= new Date(data.bidCloseTime)) {
    throw new Error("Forced close time must be greater than bid close time");
  }

  const rfq = await RFQ.create({
    ...data,
    buyerId: user.userId,
  });

  return rfq;
};

export const getAllRFQsService = async () => {
  return RFQ.find()
    .populate("buyerId", "name email")
    .sort({ createdAt: -1 });
};

export const getRFQByIdService = async (id) => {
  return RFQ.findById(id).populate("buyerId", "name email");
};