import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1200,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    date: {
      type: Date,
      required: true,
    },
    venue: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    maxParticipants: {
      type: Number,
      required: true,
      min: 1,
      max: 100000,
      default: 100,
    },
    registrationDeadline: {
      type: Date,
      required: true,
    },
    registrationClosed: {
      type: Boolean,
      default: false,
    },
    posterUrl: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export const Event = mongoose.model("Event", eventSchema);
