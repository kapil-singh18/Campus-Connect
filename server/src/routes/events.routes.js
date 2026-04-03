import { Router } from "express";
import mongoose from "mongoose";
import { authenticate, authorize } from "../middleware/auth.js";
import { Club } from "../models/Club.js";
import { Event } from "../models/Event.js";
import { Registration } from "../models/Registration.js";
import { User } from "../models/User.js";
import { asyncHandler, HttpError } from "../utils/httpError.js";
import { toStartOfDay, toEndOfDay } from "../utils/date.js";
import { toEventView } from "../utils/eventView.js";
import { createNotifications } from "../utils/notifications.js";
import { createActivityLog } from "../utils/activityLog.js";

const router = Router();

const loadEventWithClub = (eventId) =>
  Event.findById(eventId).populate({
    path: "club",
    select: "name category manager",
    populate: { path: "manager", select: "name email role" },
  });

const canManageEvent = (event, user) => {
  if (!user || user.role !== "manager") return false;
  return event.club?.manager?._id?.toString() === user._id.toString();
};

const canControlRegistration = (event, user) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  return canManageEvent(event, user);
};

const parseMaxParticipants = (value) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new HttpError(400, "maxParticipants must be an integer greater than 0.");
  }
  return parsed;
};

const parseIsoDate = (value, label) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new HttpError(400, `${label} must be a valid date.`);
  }
  return parsed;
};

const ensureDeadlineValid = (deadline, eventDate) => {
  if (deadline.getTime() > eventDate.getTime()) {
    throw new HttpError(400, "registrationDeadline must be on or before the event date.");
  }
};

const getRegistrationClosedReason = (registrationState) => {
  if (registrationState === "closed_by_manager") return "Registration is currently closed by manager/admin.";
  if (registrationState === "deadline_passed") return "Registration deadline has passed.";
  if (registrationState === "full") return "This event has reached maximum participants.";
  return "Registration is currently unavailable.";
};

const parseListView = async (events, user = null) => {
  const eventIds = events.map((event) => event._id);
  const countRows = await Registration.aggregate([
    { $match: { event: { $in: eventIds } } },
    { $group: { _id: "$event", count: { $sum: 1 } } },
  ]);

  const countMap = countRows.reduce((acc, row) => {
    acc[row._id.toString()] = row.count;
    return acc;
  }, {});

  let registeredSet = new Set();
  if (user?._id) {
    const userRegistrations = await Registration.find({
      user: user._id,
      event: { $in: eventIds },
    }).select("event");
    registeredSet = new Set(userRegistrations.map((entry) => entry.event.toString()));
  }

  const joinedClubSet = new Set((user?.joinedClubs || []).map((clubId) => clubId.toString()));

  return events.map((event) =>
    toEventView(event, {
      registrationCount: countMap[event._id.toString()] || 0,
      isRegistered: registeredSet.has(event._id.toString()),
      isClubMember: joinedClubSet.has((event.club?._id || event.club || "").toString()),
      canManage: canManageEvent(event, user),
      canControlRegistration: canControlRegistration(event, user),
    })
  );
};

router.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const { q, category, date } = req.query;
    const filter = {};

    if (q) {
      filter.title = { $regex: q, $options: "i" };
    }

    if (category) {
      filter.category = category;
    }

    if (date) {
      const day = new Date(date);
      if (!Number.isNaN(day.getTime())) {
        filter.date = { $gte: toStartOfDay(day), $lte: toEndOfDay(day) };
      }
    }

    const events = await Event.find(filter)
      .populate({
        path: "club",
        select: "name category manager",
        populate: { path: "manager", select: "name email role" },
      })
      .sort({ date: 1 });

    const payload = await parseListView(events, req.user);
    res.json({ events: payload });
  })
);

router.post(
  "/",
  authenticate,
  authorize("admin", "manager"),
  asyncHandler(async (req, res) => {
    const {
      club: clubId,
      title,
      description,
      category,
      date,
      venue,
      posterUrl,
      maxParticipants,
      registrationDeadline,
    } = req.body;

    if (
      !clubId ||
      !title ||
      !description ||
      !category ||
      !date ||
      !venue ||
      !posterUrl ||
      maxParticipants === undefined ||
      !registrationDeadline
    ) {
      throw new HttpError(400, "All event fields are required.");
    }

    if (!mongoose.Types.ObjectId.isValid(clubId)) {
      throw new HttpError(400, "Invalid club id.");
    }

    const club = await Club.findById(clubId);
    if (!club) {
      throw new HttpError(404, "Club not found.");
    }

    if (req.user.role === "manager" && club.manager.toString() !== req.user._id.toString()) {
      throw new HttpError(403, "Managers can only create events for their own club.");
    }

    const parsedEventDate = parseIsoDate(date, "date");
    const parsedDeadline = parseIsoDate(registrationDeadline, "registrationDeadline");
    const parsedMaxParticipants = parseMaxParticipants(maxParticipants);
    ensureDeadlineValid(parsedDeadline, parsedEventDate);

    const event = await Event.create({
      club: club._id,
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      date: parsedEventDate,
      venue: venue.trim(),
      posterUrl: posterUrl.trim(),
      maxParticipants: parsedMaxParticipants,
      registrationDeadline: parsedDeadline,
      registrationClosed: false,
      createdBy: req.user._id,
    });

    await createActivityLog({
      managerId: club.manager,
      actorId: req.user._id,
      actorName: req.user.name,
      action: "event_created",
      details: `${req.user.name} created event "${event.title}".`,
      clubId: club._id,
      eventId: event._id,
    });

    const loaded = await loadEventWithClub(event._id);
    res.status(201).json({
      event: toEventView(loaded, {
        canManage: canManageEvent(loaded, req.user),
        canControlRegistration: canControlRegistration(loaded, req.user),
      }),
    });
  })
);

router.get(
  "/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, "Invalid event id.");
    }

    const event = await loadEventWithClub(id);
    if (!event) {
      throw new HttpError(404, "Event not found.");
    }

    const registrationCount = await Registration.countDocuments({ event: event._id });
    const existing = await Registration.findOne({
      event: event._id,
      user: req.user._id,
    }).select("_id");

    let participants = [];
    if (canManageEvent(event, req.user)) {
      const registrations = await Registration.find({ event: event._id })
        .sort({ createdAt: -1 })
        .select("name email phone department year registeredAt");

      participants = registrations.map((entry) => ({
        name: entry.name,
        email: entry.email,
        phone: entry.phone || "",
        department: entry.department || "",
        year: entry.year || "",
        registeredAt: entry.registeredAt,
      }));
    }

    const joinedClubSet = new Set((req.user?.joinedClubs || []).map((clubId) => clubId.toString()));
    const isClubMember = joinedClubSet.has((event.club?._id || event.club || "").toString());

    res.json({
      event: toEventView(event, {
        registrationCount,
        isRegistered: Boolean(existing),
        isClubMember,
        canManage: canManageEvent(event, req.user),
        canControlRegistration: canControlRegistration(event, req.user),
      }),
      participants,
    });
  })
);

router.put(
  "/:id",
  authenticate,
  authorize("manager"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, "Invalid event id.");
    }

    const event = await loadEventWithClub(id);
    if (!event) {
      throw new HttpError(404, "Event not found.");
    }

    if (!canManageEvent(event, req.user)) {
      throw new HttpError(403, "You can only manage events for your own club.");
    }

    const fields = [
      "title",
      "description",
      "category",
      "date",
      "venue",
      "posterUrl",
      "maxParticipants",
      "registrationDeadline",
    ];
    for (const key of fields) {
      if (req.body[key] !== undefined) {
        if (key === "date") {
          event.date = parseIsoDate(req.body[key], "date");
          continue;
        }
        if (key === "registrationDeadline") {
          event.registrationDeadline = parseIsoDate(req.body[key], "registrationDeadline");
          continue;
        }
        if (key === "maxParticipants") {
          event.maxParticipants = parseMaxParticipants(req.body[key]);
          continue;
        }
        event[key] = String(req.body[key]).trim();
      }
    }

    ensureDeadlineValid(new Date(event.registrationDeadline), new Date(event.date));
    await event.save();

    await createActivityLog({
      managerId: event.club?.manager?._id,
      actorId: req.user._id,
      actorName: req.user.name,
      action: "event_updated",
      details: `${req.user.name} updated event "${event.title}".`,
      clubId: event.club?._id,
      eventId: event._id,
    });

    const updated = await loadEventWithClub(event._id);

    res.json({
      event: toEventView(updated, {
        canManage: canManageEvent(updated, req.user),
        canControlRegistration: canControlRegistration(updated, req.user),
      }),
    });
  })
);

router.patch(
  "/:id/registration-status",
  authenticate,
  authorize("admin", "manager"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { closed } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, "Invalid event id.");
    }

    if (typeof closed !== "boolean") {
      throw new HttpError(400, "closed must be a boolean.");
    }

    const event = await loadEventWithClub(id);
    if (!event) {
      throw new HttpError(404, "Event not found.");
    }

    if (!canControlRegistration(event, req.user)) {
      throw new HttpError(403, "You can only control registration for your own club events.");
    }

    event.registrationClosed = closed;
    await event.save();

    const registrationCount = await Registration.countDocuments({ event: event._id });

    await createActivityLog({
      managerId: event.club?.manager?._id,
      actorId: req.user._id,
      actorName: req.user.name,
      action: closed ? "registration_closed" : "registration_opened",
      details: `${req.user.name} ${closed ? "closed" : "opened"} registration for "${event.title}".`,
      clubId: event.club?._id,
      eventId: event._id,
    });

    const updated = await loadEventWithClub(event._id);
    res.json({
      event: toEventView(updated, {
        registrationCount,
        canManage: canManageEvent(updated, req.user),
        canControlRegistration: canControlRegistration(updated, req.user),
      }),
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
      throw new HttpError(400, "Invalid event id.");
    }

    const event = await loadEventWithClub(id);
    if (!event) {
      throw new HttpError(404, "Event not found.");
    }

    if (!canManageEvent(event, req.user)) {
      throw new HttpError(403, "You can only manage events for your own club.");
    }

    await createActivityLog({
      managerId: event.club?.manager?._id,
      actorId: req.user._id,
      actorName: req.user.name,
      action: "event_deleted",
      details: `${req.user.name} deleted event "${event.title}".`,
      clubId: event.club?._id,
      eventId: event._id,
    });

    await Registration.deleteMany({ event: event._id });
    await Event.findByIdAndDelete(event._id);

    res.json({ message: "Event deleted successfully." });
  })
);

router.post(
  "/:id/register",
  authenticate,
  authorize("student"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { phone = "", department = "", year = "" } = req.body || {};
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, "Invalid event id.");
    }

    const event = await Event.findById(id)
      .select("title club createdBy maxParticipants registrationDeadline registrationClosed date")
      .populate("club", "name manager");
    if (!event) {
      throw new HttpError(404, "Event not found.");
    }

    const currentRegistrationCount = await Registration.countDocuments({ event: event._id });
    const eventView = toEventView(event, { registrationCount: currentRegistrationCount });
    if (!eventView.registrationOpen) {
      throw new HttpError(409, getRegistrationClosedReason(eventView.registrationState));
    }

    const clubId = event.club?._id || event.club;
    const isClubMember = await Club.exists({
      _id: clubId,
      members: req.user._id,
    });
    if (!isClubMember) {
      throw new HttpError(409, "Join this club first to register for its events.");
    }

    try {
      await Registration.create({
        user: req.user._id,
        event: event._id,
        club: clubId,
        name: req.user.name,
        email: req.user.email,
        phone: String(phone || "").trim(),
        department: String(department || "").trim(),
        year: String(year || "").trim(),
      });
    } catch (error) {
      if (error.code === 11000) {
        throw new HttpError(409, "You are already registered for this event.");
      }
      throw error;
    }

    const admins = await User.find({ role: "admin" }).select("_id");
    const recipientIds = [event.club?.manager, event.createdBy, ...admins.map((admin) => admin._id)];

    const registrationCount = await Registration.countDocuments({ event: event._id });

    await createActivityLog({
      managerId: event.club?.manager,
      actorId: req.user._id,
      actorName: req.user.name,
      action: "event_registered",
      details: `${req.user.name} registered for "${event.title}".`,
      clubId: event.club?._id,
      eventId: event._id,
    });

    await createNotifications({
      actorId: req.user._id,
      actorName: req.user.name,
      recipientIds,
      type: "event_register",
      message: `${req.user.name} registered for ${event.title}. Participants: ${registrationCount}.`,
      entityType: "event",
      entityId: event._id,
      meta: {
        eventTitle: event.title,
        participantCount: registrationCount,
        student: {
          name: req.user.name,
          email: req.user.email,
          phone: String(phone || "").trim(),
          department: String(department || "").trim(),
          year: String(year || "").trim(),
        },
      },
    });
    res.status(201).json({
      message: "Event registration successful.",
      registrationCount,
    });
  })
);

router.delete(
  "/:id/register",
  authenticate,
  authorize("student"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, "Invalid event id.");
    }

    const deletion = await Registration.findOneAndDelete({
      event: id,
      user: req.user._id,
    });

    if (!deletion) {
      throw new HttpError(404, "Registration not found.");
    }

    const registrationCount = await Registration.countDocuments({ event: id });

    const event = await Event.findById(id).select("title club createdBy").populate("club", "name manager");
    if (event) {
      await createActivityLog({
        managerId: event.club?.manager,
        actorId: req.user._id,
        actorName: req.user.name,
        action: "event_unregistered",
        details: `${req.user.name} unregistered from "${event.title}".`,
        clubId: event.club?._id,
        eventId: event._id,
      });

      const admins = await User.find({ role: "admin" }).select("_id");
      const recipientIds = [event.club?.manager, event.createdBy, ...admins.map((admin) => admin._id)];

      await createNotifications({
        actorId: req.user._id,
        actorName: req.user.name,
        recipientIds,
        type: "event_unregister",
        message: `${req.user.name} unregistered from ${event.title}. Participants: ${registrationCount}.`,
        entityType: "event",
        entityId: event._id,
        meta: {
          eventTitle: event.title,
          participantCount: registrationCount,
          student: {
            name: deletion.name,
            email: deletion.email,
            phone: deletion.phone || "",
            department: deletion.department || "",
            year: deletion.year || "",
          },
        },
      });
    }
    res.json({
      message: "Unregistered from event successfully.",
      registrationCount,
    });
  })
);

export default router;
