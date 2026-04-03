import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { Club } from "../models/Club.js";
import { Event } from "../models/Event.js";
import { Registration } from "../models/Registration.js";
import { User } from "../models/User.js";
import { ActivityLog } from "../models/ActivityLog.js";
import { asyncHandler } from "../utils/httpError.js";
import { getEventStatus } from "../utils/date.js";

const router = Router();

router.get(
  "/admin",
  authenticate,
  authorize("admin"),
  asyncHandler(async (_req, res) => {
    const [users, clubs, events, registrations] = await Promise.all([
      User.countDocuments(),
      Club.countDocuments(),
      Event.countDocuments(),
      Registration.countDocuments(),
    ]);

    const latestEvents = await Event.find()
      .sort({ date: 1 })
      .limit(6)
      .populate("club", "name");

    res.json({
      stats: { users, clubs, events, registrations },
      events: latestEvents.map((event) => ({
        id: event._id,
        title: event.title,
        date: event.date,
        venue: event.venue,
        club: event.club?.name || "Unknown Club",
        status: getEventStatus(event.date),
      })),
    });
  })
);

router.get(
  "/manager",
  authenticate,
  authorize("manager"),
  asyncHandler(async (req, res) => {
    const clubs = await Club.find({ manager: req.user._id }).sort({ createdAt: -1 });
    const clubIds = clubs.map((club) => club._id);
    const [events, activityLogs] = await Promise.all([
      Event.find({ club: { $in: clubIds } })
        .sort({ date: 1 })
        .populate("club", "name"),
      ActivityLog.find({ manager: req.user._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("actorName action details createdAt"),
    ]);

    const counts = events.length
      ? await Registration.aggregate([
          { $match: { event: { $in: events.map((event) => event._id) } } },
          { $group: { _id: "$event", count: { $sum: 1 } } },
        ])
      : [];

    const countMap = counts.reduce((acc, row) => {
      acc[row._id.toString()] = row.count;
      return acc;
    }, {});

    res.json({
      stats: {
        managedClubs: clubs.length,
        managedEvents: events.length,
        totalRegistrations: counts.reduce((sum, row) => sum + row.count, 0),
      },
      clubs: clubs.map((club) => ({
        id: club._id,
        name: club.name,
        category: club.category,
        memberCount: club.members.length,
      })),
      events: events.map((event) => ({
        id: event._id,
        title: event.title,
        date: event.date,
        venue: event.venue,
        club: event.club?.name || "Unknown Club",
        status: getEventStatus(event.date),
        registrationCount: countMap[event._id.toString()] || 0,
      })),
      activityLogs: activityLogs.map((log) => ({
        id: log._id,
        actorName: log.actorName,
        action: log.action,
        details: log.details,
        createdAt: log.createdAt,
      })),
    });
  })
);

router.get(
  "/student",
  authenticate,
  authorize("student"),
  asyncHandler(async (req, res) => {
    const joinedClubs = await Club.find({ members: req.user._id })
      .sort({ createdAt: -1 })
      .select("name category description");

    const registrations = await Registration.find({ user: req.user._id })
      .populate({
        path: "event",
        select: "title date venue category club",
        populate: {
          path: "club",
          select: "name",
        },
      })
      .sort({ createdAt: -1 });

    const upcomingEvents = await Event.find({ date: { $gte: new Date() } })
      .sort({ date: 1 })
      .limit(6)
      .populate("club", "name");

    res.json({
      stats: {
        joinedClubs: joinedClubs.length,
        registeredEvents: registrations.length,
      },
      clubs: joinedClubs.map((club) => ({
        id: club._id,
        name: club.name,
        category: club.category,
        description: club.description,
      })),
      registeredEvents: registrations
        .filter((item) => item.event)
        .map((item) => ({
          id: item.event._id,
          title: item.event.title,
          date: item.event.date,
          venue: item.event.venue,
          category: item.event.category,
          club: item.event.club?.name || "Unknown Club",
          status: getEventStatus(item.event.date),
        })),
      upcomingEvents: upcomingEvents.map((event) => ({
        id: event._id,
        title: event.title,
        date: event.date,
        venue: event.venue,
        category: event.category,
        club: event.club?.name || "Unknown Club",
        status: getEventStatus(event.date),
      })),
    });
  })
);

export default router;
