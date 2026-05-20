import { PointLedger } from "../models/PointLedger.js";
import { User } from "../models/User.js";
import { createNotifications } from "./notifications.js";

export const POINTS = {
  signup: 10,
  login: 10,
  join_club: 50,
  event_register: 20,
  club_member_joined: 50,
};

export const awardPoints = async ({
  userId,
  role,
  reason,
  entityType = "auth",
  entityId,
  message,
  notify = true,
}) => {
  const points = POINTS[reason] || 0;
  if (!points || !["student", "manager"].includes(role)) return null;

  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { points } },
    { new: true, select: "name role" }
  );
  if (!user) return null;

  const ledger = await PointLedger.create({
    user: userId,
    role,
    points,
    reason,
    entityType,
    entityId,
    message: message || `${points} points earned.`,
  });

  if (notify) {
    await createNotifications({
      actorId: userId,
      actorName: user.name,
      recipientIds: [userId],
      type: "points_earned",
      message: message || `+${points} Points Earned`,
      entityType: "points",
      entityId: ledger._id,
      meta: { points, reason },
      includeActor: true,
    });
  }

  return { points, totalPoints: user.points, ledgerId: ledger._id };
};
