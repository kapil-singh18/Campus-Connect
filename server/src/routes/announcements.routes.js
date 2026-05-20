import { Router } from "express";
import mongoose from "mongoose";
import { authenticate, authorize } from "../middleware/auth.js";
import { Announcement } from "../models/Announcement.js";
import { Club } from "../models/Club.js";
import { asyncHandler, HttpError } from "../utils/httpError.js";
import { createNotifications } from "../utils/notifications.js";

const router = Router();

const toAnnouncementView = (announcement, user) => ({
  id: announcement._id,
  title: announcement.title,
  content: announcement.content,
  club: announcement.club,
  createdBy: announcement.createdBy,
  createdAt: announcement.createdAt,
  updatedAt: announcement.updatedAt,
  canManage:
    user?.role === "manager" &&
    announcement.club?.manager?.toString?.() === user._id.toString(),
});

const ensureClubAccess = async (clubId, user) => {
  if (!mongoose.Types.ObjectId.isValid(clubId)) {
    throw new HttpError(400, "Invalid club id.");
  }

  const club = await Club.findById(clubId).populate("members", "_id");
  if (!club) throw new HttpError(404, "Club not found.");
  if (user.role === "manager" && club.manager.toString() !== user._id.toString()) {
    throw new HttpError(403, "Managers can only post announcements for their own club.");
  }
  return club;
};

router.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const filter = {};

    if (req.user.role === "student") {
      filter.club = { $in: req.user.joinedClubs || [] };
    } else if (req.user.role === "manager") {
      const managedClubs = await Club.find({ manager: req.user._id }).select("_id");
      filter.club = { $in: managedClubs.map((club) => club._id) };
    }

    const announcements = await Announcement.find(filter)
      .populate("club", "name category manager")
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 })
      .limit(80);

    res.json({
      announcements: announcements.map((item) => toAnnouncementView(item, req.user)),
    });
  })
);

router.post(
  "/",
  authenticate,
  authorize("admin", "manager"),
  asyncHandler(async (req, res) => {
    const { title, content, club: clubId } = req.body || {};
    if (!title || !content || !clubId) {
      throw new HttpError(400, "Title, content, and club are required.");
    }

    const club = await ensureClubAccess(clubId, req.user);
    const announcement = await Announcement.create({
      title: String(title).trim(),
      content: String(content).trim(),
      club: club._id,
      createdBy: req.user._id,
    });

    await createNotifications({
      actorId: req.user._id,
      actorName: req.user.name,
      recipientIds: club.members,
      type: "announcement",
      message: `${club.name}: ${announcement.title}`,
      entityType: "announcement",
      entityId: announcement._id,
      meta: {
        clubId: club._id,
        clubName: club.name,
        title: announcement.title,
      },
    });

    const loaded = await Announcement.findById(announcement._id)
      .populate("club", "name category manager")
      .populate("createdBy", "name email role");

    res.status(201).json({
      announcement: toAnnouncementView(loaded, req.user),
      message: "Announcement posted successfully.",
    });
  })
);

router.put(
  "/:id",
  authenticate,
  authorize("admin", "manager"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError(400, "Invalid announcement id.");

    const announcement = await Announcement.findById(id).populate("club", "name manager");
    if (!announcement) throw new HttpError(404, "Announcement not found.");
    if (req.user.role === "manager" && announcement.club.manager.toString() !== req.user._id.toString()) {
      throw new HttpError(403, "You can only edit announcements for your club.");
    }

    if (req.body.title !== undefined) announcement.title = String(req.body.title).trim();
    if (req.body.content !== undefined) announcement.content = String(req.body.content).trim();
    await announcement.save();

    const loaded = await Announcement.findById(announcement._id)
      .populate("club", "name category manager")
      .populate("createdBy", "name email role");

    res.json({ announcement: toAnnouncementView(loaded, req.user) });
  })
);

router.delete(
  "/:id",
  authenticate,
  authorize("admin", "manager"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError(400, "Invalid announcement id.");

    const announcement = await Announcement.findById(id).populate("club", "manager");
    if (!announcement) throw new HttpError(404, "Announcement not found.");
    if (req.user.role === "manager" && announcement.club.manager.toString() !== req.user._id.toString()) {
      throw new HttpError(403, "You can only delete announcements for your club.");
    }

    await Announcement.findByIdAndDelete(id);
    res.json({ message: "Announcement deleted successfully." });
  })
);

export default router;
