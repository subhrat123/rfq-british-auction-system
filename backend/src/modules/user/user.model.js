import mongoose from "mongoose";

// Represents system users (buyers & suppliers)
// Used for ownership of RFQs and bids
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["buyer", "supplier"],
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);