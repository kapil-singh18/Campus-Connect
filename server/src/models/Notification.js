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
      enum: ["club_join", "club_leave", "event_register", "event_unregister"],
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
      enum: ["club", "event"],
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
