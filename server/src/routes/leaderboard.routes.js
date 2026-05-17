import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { Club } from "../models/Club.js";
import { Event } from "../models/Event.js";
import { Registration } from "../models/Registration.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/httpError.js";

const router = Router();

const initialsFor = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

const buildStudentBadges = ({ registrations, joinedClubs }) => {
  const badges = [];
  if (registrations >= 5) badges.push("Event Pro");
  if (joinedClubs >= 3) badges.push("Club Builder");
  if (registrations >= 2 && joinedClubs >= 2) badges.push("Campus Active");
  return badges;
};

router.get(
  "/",
  authenticate,
  asyncHandler(async (_req, res) => {
    const [students, registrationRows, clubs, eventRows] = await Promise.all([
      User.find({ role: "student" }).select("name email joinedClubs createdAt").lean(),
      Registration.aggregate([
        {
          $group: {
            _id: "$user",
            registrations: { $sum: 1 },
            departments: { $addToSet: "$department" },
            years: { $addToSet: "$year" },
            clubs: { $addToSet: "$club" },
          },
        },
      ]),
      Club.find().select("name category members").lean(),
      Event.aggregate([
        {
          $lookup: {
            from: "registrations",
            localField: "_id",
            foreignField: "event",
            as: "registrations",
          },
        },
        {
          $group: {
            _id: "$club",
            events: { $sum: 1 },
            registrations: { $sum: { $size: "$registrations" } },
          },
        },
      ]),
    ]);

    const registrationMap = new Map(
      registrationRows.map((row) => [
        row._id?.toString(),
        {
          registrations: row.registrations || 0,
          departments: row.departments?.filter(Boolean) || [],
          years: row.years?.filter(Boolean) || [],
          clubIds: row.clubs?.map((clubId) => clubId.toString()) || [],
        },
      ])
    );

    const clubMap = new Map(clubs.map((club) => [club._id.toString(), club]));
    const eventMap = new Map(
      eventRows.map((row) => [
        row._id?.toString(),
        { events: row.events || 0, registrations: row.registrations || 0 },
      ])
    );

    const studentRows = students
      .map((student) => {
        const stats = registrationMap.get(student._id.toString()) || {
          registrations: 0,
          departments: [],
          years: [],
          clubIds: [],
        };
        const joinedClubIds = (student.joinedClubs || []).map((clubId) => clubId.toString());
        const uniqueClubIds = [...new Set([...joinedClubIds, ...stats.clubIds])];
        const primaryClub = uniqueClubIds.map((clubId) => clubMap.get(clubId)).find(Boolean);
        const joinedClubs = uniqueClubIds.length;
        const points = stats.registrations * 100 + joinedClubs * 40;

        return {
          id: student._id,
          name: student.name,
          email: student.email,
          avatar: initialsFor(student.name),
          club: primaryClub?.name || "No club yet",
          department: stats.departments[0] || "Not provided",
          year: stats.years[0] || "Not provided",
          events: stats.registrations,
          clubs: joinedClubs,
          points,
          badges: buildStudentBadges({ registrations: stats.registrations, joinedClubs }),
        };
      })
      .filter((student) => student.points > 0)
      .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
      .map((student, index) => ({ ...student, rank: index + 1 }));

    const clubRows = clubs
      .map((club) => {
        const stats = eventMap.get(club._id.toString()) || { events: 0, registrations: 0 };
        const members = club.members?.length || 0;
        const points = stats.registrations * 80 + members * 20 + stats.events * 30;
        return {
          id: club._id,
          name: club.name,
          category: club.category,
          members,
          events: stats.events,
          registrations: stats.registrations,
          points,
        };
      })
      .filter((club) => club.points > 0)
      .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
      .map((club, index) => ({ ...club, rank: index + 1 }));

    res.json({
      students: studentRows,
      clubs: clubRows,
      generatedFrom: {
        students: students.length,
        clubs: clubs.length,
        registrations: registrationRows.reduce((sum, row) => sum + (row.registrations || 0), 0),
      },
    });
  })
);

export default router;
