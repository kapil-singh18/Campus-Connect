import mongoose from "mongoose";
import { ActivityLog } from "../models/ActivityLog.js";

const toObjectId = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (value?._id instanceof mongoose.Types.ObjectId) return value._id;
  if (typeof value === "string" && mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }
  return null;
};

export const createActivityLog = async ({
  managerId,
  actorId,
  actorName,
  action,
  details,
  clubId = null,
  eventId = null,
  meta = {},
}) => {
  const manager = toObjectId(managerId);
  const actor = toObjectId(actorId);

  if (!manager || !actor || !actorName || !action || !details) return;

  await ActivityLog.create({
    manager,
    actor,
    actorName: String(actorName).trim(),
    action: String(action).trim(),
    details: String(details).trim(),
    club: toObjectId(clubId),
    event: toObjectId(eventId),
    meta,
  });
};
