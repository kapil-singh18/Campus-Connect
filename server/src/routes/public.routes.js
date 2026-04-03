import { Router } from "express";
import { Club } from "../models/Club.js";
import { Event } from "../models/Event.js";
import { asyncHandler } from "../utils/httpError.js";
import { getEventStatus, toStartOfDay } from "../utils/date.js";

const router = Router();

router.get(
  "/landing",
  asyncHandler(async (_req, res) => {
    const todayStart = toStartOfDay(new Date());

    const [clubRows, eventRows] = await Promise.all([
      Club.aggregate([
        {
          $addFields: {
            memberCount: { $size: { $ifNull: ["$members", []] } },
          },
        },
        { $sort: { memberCount: -1, createdAt: -1 } },
        { $limit: 4 },
        {
          $project: {
            _id: 1,
            name: 1,
            category: 1,
            description: 1,
            memberCount: 1,
          },
        },
      ]),
      Event.find({ date: { $gte: todayStart } })
        .sort({ date: 1 })
        .limit(4)
        .populate("club", "name")
        .select("title category date venue posterUrl maxParticipants registrationDeadline registrationClosed"),
    ]);

    const clubs = clubRows.map((club) => ({
      id: club._id,
      name: club.name,
      category: club.category,
      description: club.description,
      memberCount: club.memberCount || 0,
    }));

    const events = eventRows.map((event) => ({
      id: event._id,
      title: event.title,
      category: event.category,
      date: event.date,
      venue: event.venue,
      posterUrl: event.posterUrl,
      club: event.club?.name || "Unknown Club",
      status: getEventStatus(event.date),
      maxParticipants: event.maxParticipants,
      registrationDeadline: event.registrationDeadline,
      registrationClosed: Boolean(event.registrationClosed),
    }));

    res.json({ clubs, events });
  })
);

export default router;
