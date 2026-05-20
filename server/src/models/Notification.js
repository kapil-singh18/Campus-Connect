import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
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
    },
    type: {
      type: String,
      enum: [
        "club_join",
        "club_leave",
        "join_request",
        "join_request_accepted",
        "join_request_rejected",
        "event_register",
        "event_unregister",
        "announcement",
        "points_earned",
      ],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 240,
    },
    entityType: {
      type: String,
      enum: ["club", "event", "announcement", "join_request", "points"],
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

export const Notification = mongoose.model("Notification", notificationSchema);
