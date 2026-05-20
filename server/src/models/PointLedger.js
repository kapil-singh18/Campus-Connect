import mongoose from "mongoose";

const pointLedgerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["student", "manager"],
      required: true,
      index: true,
    },
    points: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      enum: ["signup", "login", "join_club", "event_register", "club_member_joined"],
      required: true,
    },
    entityType: {
      type: String,
      enum: ["club", "event", "auth"],
      default: "auth",
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    message: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

export const PointLedger = mongoose.model("PointLedger", pointLedgerSchema);
