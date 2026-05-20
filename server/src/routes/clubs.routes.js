import { Router } from "express";
import mongoose from "mongoose";
import { authenticate, authorize } from "../middleware/auth.js";
import { Club } from "../models/Club.js";
import { Event } from "../models/Event.js";
import { Notification } from "../models/Notification.js";
import { Registration } from "../models/Registration.js";
import { User } from "../models/User.js";
import { JoinRequest } from "../models/JoinRequest.js";
import { asyncHandler, HttpError } from "../utils/httpError.js";
import { createNotifications } from "../utils/notifications.js";
import { createActivityLog } from "../utils/activityLog.js";
import { toEndOfDay } from "../utils/date.js";
import { awardPoints } from "../utils/points.js";

const router = Router();

router.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const clubs = await Club.find()
      .populate("manager", "name email role")
      .sort({ createdAt: -1 });

    const pendingRequests =
      req.user.role === "student"
        ? await JoinRequest.find({
            student: req.user._id,
            club: { $in: clubs.map((club) => club._id) },
            status: "pending",
          }).select("club")
        : [];
    const pendingClubIds = new Set(pendingRequests.map((request) => request.club.toString()));

    const payload = clubs.map((club) => ({
      id: club._id,
      name: club.name,
      description: club.description,
      category: club.category,
      logoUrl: club.logoUrl,
      bannerUrl: club.bannerUrl,
      manager: club.manager,
      memberCount: club.members.length,
      isMember: club.members.some(
        (memberId) => memberId.toString() === req.user._id.toString()
      ),
      joinRequestStatus: pendingClubIds.has(club._id.toString()) ? "pending" : null,
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
        logoUrl: populated.logoUrl,
        bannerUrl: populated.bannerUrl,
        manager: populated.manager,
        memberCount: populated.members.length,
        createdAt: populated.createdAt,
      },
    });
  })
);

router.get(
  "/join-requests",
  authenticate,
  authorize("manager"),
  asyncHandler(async (req, res) => {
    const requests = await JoinRequest.find({ manager: req.user._id, status: "pending" })
      .populate("student", "name email role")
      .populate("club", "name category")
      .sort({ createdAt: -1 });

    res.json({
      requests: requests.map((request) => ({
        id: request._id,
        student: request.student,
        club: request.club,
        studentMeta: request.studentMeta,
        status: request.status,
        createdAt: request.createdAt,
      })),
    });
  })
);

router.patch(
  "/join-requests/:requestId",
  authenticate,
  authorize("manager"),
  asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const { action } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      throw new HttpError(400, "Invalid join request id.");
    }
    if (!["accept", "reject"].includes(action)) {
      throw new HttpError(400, "Action must be accept or reject.");
    }

    const request = await JoinRequest.findById(requestId).populate("club", "name manager members");
    if (!request) throw new HttpError(404, "Join request not found.");
    if (request.manager.toString() !== req.user._id.toString()) {
      throw new HttpError(403, "You can only review requests for your club.");
    }
    if (request.status !== "pending") {
      throw new HttpError(409, "This join request has already been reviewed.");
    }

    request.status = action === "accept" ? "accepted" : "rejected";
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    if (action === "accept") {
      const club = await Club.findById(request.club._id);
      const alreadyMember = club.members.some((memberId) => memberId.toString() === request.student.toString());
      if (!alreadyMember) {
        club.members.push(request.student);
        await club.save();
        await User.findByIdAndUpdate(request.student, { $addToSet: { joinedClubs: club._id } });

        await awardPoints({
          userId: request.student,
          role: "student",
          reason: "join_club",
          entityType: "club",
          entityId: club._id,
          message: "+50 Points Earned for joining a club.",
        });
        await awardPoints({
          userId: req.user._id,
          role: "manager",
          reason: "club_member_joined",
          entityType: "club",
          entityId: club._id,
          message: "+50 Points Earned for approving a new club member.",
        });
      }

      await createActivityLog({
        managerId: req.user._id,
        actorId: request.student,
        actorName: request.studentMeta?.name || "Student",
        action: "club_joined",
        details: `${request.studentMeta?.name || "A student"} joined "${club.name}".`,
        clubId: club._id,
      });
    }

    await createNotifications({
      actorId: req.user._id,
      actorName: req.user.name,
      recipientIds: [request.student],
      type: action === "accept" ? "join_request_accepted" : "join_request_rejected",
      message:
        action === "accept"
          ? `Your request to join ${request.club.name} was accepted.`
          : `Your request to join ${request.club.name} was rejected.`,
      entityType: "club",
      entityId: request.club._id,
      meta: {
        clubName: request.club.name,
        requestId: request._id,
        status: request.status,
      },
    });

    res.json({
      message: action === "accept" ? "Join request accepted." : "Join request rejected.",
      request: { id: request._id, status: request.status },
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
        logoUrl: club.logoUrl,
        bannerUrl: club.bannerUrl,
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

    if (isAlreadyMember) {
      res.json({
        message: "You are already a member of this club.",
        clubId: club._id,
      });
      return;
    }

    const existingRequest = await JoinRequest.findOne({
      student: req.user._id,
      club: club._id,
      status: "pending",
    });

    if (existingRequest) {
      res.json({
        message: "Your join request is already pending manager approval.",
        clubId: club._id,
        requestId: existingRequest._id,
        status: existingRequest.status,
      });
      return;
    }

    const joinRequest = await JoinRequest.create({
      student: req.user._id,
      club: club._id,
      manager: club.manager,
      studentMeta,
    });

    const admins = await User.find({ role: "admin" }).select("_id");
    const recipientIds = [club.manager, ...admins.map((admin) => admin._id)];

    await createNotifications({
      actorId: req.user._id,
      actorName: req.user.name,
      recipientIds,
      type: "join_request",
      message: `${req.user.name} requested to join ${club.name}.`,
      entityType: "join_request",
      entityId: joinRequest._id,
      meta: {
        clubId: club._id,
        clubName: club.name,
        student: studentMeta,
      },
    });

    res.json({
      message: "Join request sent for manager approval.",
      clubId: club._id,
      requestId: joinRequest._id,
      status: joinRequest.status,
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
