import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    actorName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    details: {
      type: String,
      required: true,
      trim: true,
      maxlength: 320,
    },
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      default: null,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      default: null,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

export const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
