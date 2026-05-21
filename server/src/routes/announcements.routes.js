import { Router } from "express";
import mongoose from "mongoose";
import { authenticate, authorize } from "../middleware/auth.js";
import { ActivityLog } from "../models/ActivityLog.js";
import { Announcement } from "../models/Announcement.js";
import { Club } from "../models/Club.js";
import { User } from "../models/User.js";
import { asyncHandler, HttpError } from "../utils/httpError.js";
import { createNotifications } from "../utils/notifications.js";

const router = Router();

const GLOBAL_AUDIENCES = new Set(["students", "managers", "all"]);

const getAnnouncementAudienceLabel = (audience, clubName = "") => {
  if (audience === "students") return "All Students";
  if (audience === "managers") return "All Managers";
  if (audience === "all") return "All Users";
  return clubName || "Club";
};

const getAudienceRecipients = async (audience, club) => {
  if (audience === "students") {
    return User.find({ role: "student" }).select("_id");
  }
  if (audience === "managers") {
    return User.find({ role: "manager" }).select("_id");
  }
  if (audience === "all") {
    return User.find({ role: { $in: ["student", "manager", "admin"] } }).select("_id");
  }
  return club.members;
};

const toAnnouncementView = (announcement, user) => ({
  id: announcement._id,
  title: announcement.title,
  content: announcement.content,
  audience: announcement.audience,
  audienceLabel: getAnnouncementAudienceLabel(announcement.audience, announcement.club?.name || ""),
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
    const announcements = await Announcement.find()
      .populate("club", "name category manager")
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 })
      .limit(80);

    const managedClubs = req.user.role === "manager"
      ? await Club.find({ manager: req.user._id }).select("_id")
      : [];
    const joinedClubIds = new Set((req.user.joinedClubs || []).map((clubId) => clubId.toString()));
    const managedClubIds = new Set(managedClubs.map((club) => club._id.toString()));

    const visibleAnnouncements = announcements.filter((announcement) => {
      if (req.user.role === "admin") return true;
      if (announcement.audience === "all") return true;
      if (announcement.audience === "students" && req.user.role === "student") return true;
      if (announcement.audience === "managers" && req.user.role === "manager") return true;
      if (announcement.audience === "club") {
        const clubId = announcement.club?._id?.toString?.() || announcement.club?.toString?.();
        if (req.user.role === "student") return joinedClubIds.has(clubId);
        if (req.user.role === "manager") return managedClubIds.has(clubId);
      }
      return false;
    });

    res.json({
      announcements: visibleAnnouncements.map((item) => toAnnouncementView(item, req.user)),
    });
  })
);

router.post(
  "/",
  authenticate,
  authorize("admin", "manager"),
  asyncHandler(async (req, res) => {
    const { title, content, club: clubId, audience = "club" } = req.body || {};
    if (!title || !content || !clubId) {
      if (req.user.role === "manager" || audience === "club") {
        throw new HttpError(400, "Title, content, and club are required.");
      }
    }

    if (req.user.role === "manager" && audience !== "club") {
      throw new HttpError(403, "Managers can only post club announcements.");
    }

    const normalizedAudience = GLOBAL_AUDIENCES.has(audience) ? audience : "club";
    const club = normalizedAudience === "club" ? await ensureClubAccess(clubId, req.user) : null;

    if (req.user.role === "admin" && normalizedAudience === "club" && !clubId) {
      throw new HttpError(400, "Club is required for club announcements.");
    }

    const announcement = await Announcement.create({
      title: String(title).trim(),
      content: String(content).trim(),
      audience: normalizedAudience,
      club: club?._id || null,
      createdBy: req.user._id,
    });

    const recipients = await getAudienceRecipients(normalizedAudience, club || { members: [] });
    const recipientIds = recipients.map((recipient) => recipient._id);

    await createNotifications({
      actorId: req.user._id,
      actorName: req.user.name,
      recipientIds,
      type: "announcement",
      message: normalizedAudience === "club" ? `${club.name}: ${announcement.title}` : announcement.title,
      entityType: "announcement",
      entityId: announcement._id,
      meta: {
        clubId: club?._id || null,
        clubName: club?.name || getAnnouncementAudienceLabel(normalizedAudience),
        title: announcement.title,
        audience: normalizedAudience,
      },
    });

    if (req.user.role === "admin") {
      await createNotifications({
        actorId: req.user._id,
        actorName: req.user.name,
        recipientIds: [req.user._id],
        type: "announcement",
        message: normalizedAudience === "club" ? `${club.name}: ${announcement.title}` : announcement.title,
        entityType: "announcement",
        entityId: announcement._id,
        meta: {
          clubId: club?._id || null,
          clubName: club?.name || getAnnouncementAudienceLabel(normalizedAudience),
          title: announcement.title,
          audience: normalizedAudience,
        },
        includeActor: true,
      });
    }

    await ActivityLog.create({
      manager: req.user._id,
      actor: req.user._id,
      actorName: req.user.name,
      action: normalizedAudience === "club" ? "announcement_posted" : "global_announcement_posted",
      details:
        normalizedAudience === "club"
          ? `${req.user.name} posted an announcement for ${club.name}.`
          : `${req.user.name} posted a ${getAnnouncementAudienceLabel(normalizedAudience).toLowerCase()} announcement.`,
      club: club?._id || null,
      meta: { audience: normalizedAudience, announcementId: announcement._id },
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
    if (req.user.role === "manager" && announcement.club?.manager?.toString() !== req.user._id.toString()) {
      throw new HttpError(403, "You can only edit announcements for your club.");
    }

    if (req.body.title !== undefined) announcement.title = String(req.body.title).trim();
    if (req.body.content !== undefined) announcement.content = String(req.body.content).trim();
    if (req.user.role === "admin" && req.body.audience !== undefined) {
      const nextAudience = GLOBAL_AUDIENCES.has(req.body.audience) ? req.body.audience : "club";
      announcement.audience = nextAudience;
      if (nextAudience === "club") {
        const club = await ensureClubAccess(req.body.club, req.user);
        announcement.club = club._id;
      } else {
        announcement.club = null;
      }
    }
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
    if (req.user.role === "manager" && announcement.club?.manager?.toString() !== req.user._id.toString()) {
      throw new HttpError(403, "You can only delete announcements for your club.");
    }

    await Announcement.findByIdAndDelete(id);
    res.json({ message: "Announcement deleted successfully." });
  })
);

export default router;
