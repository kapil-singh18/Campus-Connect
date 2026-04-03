import { Router } from "express";
import mongoose from "mongoose";
import { authenticate } from "../middleware/auth.js";
import { Notification } from "../models/Notification.js";
import { asyncHandler, HttpError } from "../utils/httpError.js";

const router = Router();

router.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30);

    res.json({
      unreadCount: notifications.filter((item) => !item.read).length,
      notifications: notifications.map((item) => ({
        id: item._id,
        type: item.type,
        actorName: item.actorName,
        message: item.message,
        entityType: item.entityType,
        entityId: item.entityId,
        meta: item.meta || {},
        read: item.read,
        createdAt: item.createdAt,
      })),
    });
  })
);

router.patch(
  "/:id/read",
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, "Invalid notification id.");
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.user._id },
      { $set: { read: true } },
      { new: true }
    );

    if (!notification) {
      throw new HttpError(404, "Notification not found.");
    }

    res.json({ message: "Notification marked as read." });
  })
);

router.post(
  "/read-all",
  authenticate,
  asyncHandler(async (req, res) => {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { $set: { read: true } });
    res.json({ message: "All notifications marked as read." });
  })
);

export default router;
