import mongoose from "mongoose";

const joinRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: true,
      index: true,
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
      index: true,
    },
    studentMeta: {
      name: { type: String, trim: true, default: "" },
      email: { type: String, trim: true, lowercase: true, default: "" },
      department: { type: String, trim: true, default: "" },
      year: { type: String, trim: true, default: "" },
      phone: { type: String, trim: true, default: "" },
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: Date,
  },
  { timestamps: true }
);

joinRequestSchema.index({ student: 1, club: 1, status: 1 });

export const JoinRequest = mongoose.model("JoinRequest", joinRequestSchema);
