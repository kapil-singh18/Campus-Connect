import { Router } from "express";
import mongoose from "mongoose";
import { authenticate, authorize } from "../middleware/auth.js";
import { Club } from "../models/Club.js";
import { Event } from "../models/Event.js";
import { Notification } from "../models/Notification.js";
import { Registration } from "../models/Registration.js";
import { User } from "../models/User.js";
import { asyncHandler, HttpError } from "../utils/httpError.js";
import { createNotifications } from "../utils/notifications.js";
import { createActivityLog } from "../utils/activityLog.js";
import { toEndOfDay } from "../utils/date.js";

const router = Router();

router.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const clubs = await Club.find()
      .populate("manager", "name email role")
      .sort({ createdAt: -1 });

    const payload = clubs.map((club) => ({
      id: club._id,
      name: club.name,
      description: club.description,
      category: club.category,
      manager: club.manager,
      memberCount: club.members.length,
      isMember: club.members.some(
        (memberId) => memberId.toString() === req.user._id.toString()
      ),
      canManage:
        req.user.role === "manager" &&
        club.manager?._id?.toString() === req.user._id.toString(),
      createdAt: club.createdAt,
    }));

    res.json({ clubs: payload });
  })
);

router.post(
  "/",
  authenticate,
  authorize("admin", "manager"),
  asyncHandler(async (req, res) => {
    const { name, description, category, managerId } = req.body;

    if (!name || !description || !category) {
      throw new HttpError(400, "Name, description, and category are required.");
    }

    let selectedManagerId = req.user._id.toString();

    if (req.user.role === "admin") {
      if (managerId) {
        if (!mongoose.Types.ObjectId.isValid(managerId)) {
          throw new HttpError(400, "Invalid managerId.");
        }

        const manager = await User.findById(managerId);
        if (!manager || manager.role !== "manager") {
          throw new HttpError(400, "managerId must reference a valid Club Manager.");
        }
        selectedManagerId = managerId;
      }
    } else if (req.user.role !== "manager") {
      throw new HttpError(403, "Only admin or manager can create clubs.");
    }

    const existing = await Club.findOne({ name: name.trim() });
    if (existing) {
      throw new HttpError(409, "A club with this name already exists.");
    }

    const club = await Club.create({
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      manager: selectedManagerId,
      members: [],
    });

    await createActivityLog({
      managerId: selectedManagerId,
      actorId: req.user._id,
      actorName: req.user.name,
      action: "club_created",
      details: `${req.user.name} created club "${club.name}".`,
      clubId: club._id,
    });

    const populated = await Club.findById(club._id).populate("manager", "name email role");
    res.status(201).json({
      club: {
        id: populated._id,
        name: populated.name,
        description: populated.description,
        category: populated.category,
        manager: populated.manager,
        memberCount: populated.members.length,
        createdAt: populated.createdAt,
      },
    });
  })
);

router.get(
  "/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, "Invalid club id.");
    }

    const club = await Club.findById(id)
      .populate("manager", "name email role")
      .populate("members", "name email role");

    if (!club) {
      throw new HttpError(404, "Club not found.");
    }

    const events = await Event.find({ club: club._id }).sort({ date: 1 });
    const todayEnd = toEndOfDay(new Date());
    const upcomingEventCount = events.filter((event) => new Date(event.date).getTime() > todayEnd.getTime()).length;

    const isMember = club.members.some(
      (member) => member._id.toString() === req.user._id.toString()
    );

    res.json({
      club: {
        id: club._id,
        name: club.name,
        description: club.description,
        category: club.category,
        manager: club.manager,
        members: club.members,
        memberCount: club.members.length,
        isMember,
        upcomingEventCount,
        canManage:
          req.user.role === "manager" &&
          club.manager?._id?.toString() === req.user._id.toString(),
      },
      events: events.map((event) => ({
        id: event._id,
        title: event.title,
        category: event.category,
        date: event.date,
        venue: event.venue,
        posterUrl: event.posterUrl,
      })),
    });
  })
);

router.post(
  "/:id/join",
  authenticate,
  authorize("student"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, "Invalid club id.");
    }

    const club = await Club.findById(id);
    if (!club) {
      throw new HttpError(404, "Club not found.");
    }

    const studentMeta = {
      name: String(req.body?.name || req.user.name || "").trim() || req.user.name,
      email: String(req.body?.email || req.user.email || "").trim() || req.user.email,
      department: String(req.body?.department || "").trim(),
      year: String(req.body?.year || "").trim(),
      phone: String(req.body?.phone || "").trim(),
    };

    const userId = req.user._id.toString();
    const isAlreadyMember = club.members.some((memberId) => memberId.toString() === userId);

    if (!isAlreadyMember) {
      club.members.push(req.user._id);
      await club.save();
    }

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { joinedClubs: club._id },
    });

    if (!isAlreadyMember) {
      const admins = await User.find({ role: "admin" }).select("_id");
      const recipientIds = [club.manager, ...admins.map((admin) => admin._id)];

      await createActivityLog({
        managerId: club.manager,
        actorId: req.user._id,
        actorName: req.user.name,
        action: "club_joined",
        details: `${req.user.name} joined "${club.name}".`,
        clubId: club._id,
      });

      await createNotifications({
        actorId: req.user._id,
        actorName: req.user.name,
        recipientIds,
        type: "club_join",
        message: `${req.user.name} joined ${club.name}. Members: ${club.members.length}.`,
        entityType: "club",
        entityId: club._id,
        meta: {
          clubName: club.name,
          memberCount: club.members.length,
          student: studentMeta,
        },
      });
    }

    res.json({
      message: isAlreadyMember
        ? "You are already a member of this club."
        : "Joined club successfully.",
      clubId: club._id,
    });
  })
);

router.delete(
  "/:id/join",
  authenticate,
  authorize("student"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, "Invalid club id.");
    }

    const club = await Club.findById(id);
    if (!club) {
      throw new HttpError(404, "Club not found.");
    }

    const userId = req.user._id.toString();
    const isMember = club.members.some((memberId) => memberId.toString() === userId);

    if (!isMember) {
      throw new HttpError(404, "You are not a member of this club.");
    }

    club.members = club.members.filter((memberId) => memberId.toString() !== userId);
    await club.save();

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { joinedClubs: club._id },
    });

    const admins = await User.find({ role: "admin" }).select("_id");
    const recipientIds = [club.manager, ...admins.map((admin) => admin._id)];

    await createActivityLog({
      managerId: club.manager,
      actorId: req.user._id,
      actorName: req.user.name,
      action: "club_left",
      details: `${req.user.name} left "${club.name}".`,
      clubId: club._id,
    });

    await createNotifications({
      actorId: req.user._id,
      actorName: req.user.name,
      recipientIds,
      type: "club_leave",
      message: `${req.user.name} left ${club.name}. Members: ${club.members.length}.`,
      entityType: "club",
      entityId: club._id,
      meta: {
        clubName: club.name,
        memberCount: club.members.length,
        student: {
          name: req.user.name,
          email: req.user.email,
        },
      },
    });

    res.json({
      message: "Left club successfully.",
      clubId: club._id,
    });
  })
);

router.delete(
  "/:id",
  authenticate,
  authorize("manager"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, "Invalid club id.");
    }

    const club = await Club.findById(id).select("name manager");
    if (!club) {
      throw new HttpError(404, "Club not found.");
    }

    if (club.manager.toString() !== req.user._id.toString()) {
      throw new HttpError(403, "Only this club's manager can delete it.");
    }

    const todayEnd = toEndOfDay(new Date());
    const upcomingEventCount = await Event.countDocuments({
      club: club._id,
      date: { $gt: todayEnd },
    });

    if (upcomingEventCount > 0) {
      throw new HttpError(
        409,
        `Cannot delete club "${club.name}" because ${upcomingEventCount} upcoming event(s) are still scheduled.`
      );
    }

    const clubEvents = await Event.find({ club: club._id }).select("_id");
    const eventIds = clubEvents.map((event) => event._id);

    await createActivityLog({
      managerId: club.manager,
      actorId: req.user._id,
      actorName: req.user.name,
      action: "club_deleted",
      details: `${req.user.name} deleted club "${club.name}".`,
      clubId: club._id,
    });

    await Promise.all([
      Registration.deleteMany({
        $or: [{ club: club._id }, { event: { $in: eventIds } }],
      }),
      Notification.deleteMany({
        $or: [
          { entityType: "club", entityId: club._id },
          { entityType: "event", entityId: { $in: eventIds } },
        ],
      }),
      Event.deleteMany({ club: club._id }),
      User.updateMany({ joinedClubs: club._id }, { $pull: { joinedClubs: club._id } }),
      Club.findByIdAndDelete(club._id),
    ]);

    res.json({ message: "Club deleted successfully." });
  })
);

export default router;
