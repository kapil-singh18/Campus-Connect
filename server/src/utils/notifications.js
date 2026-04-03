import { Notification } from "../models/Notification.js";

export const createNotifications = async ({
  actorId,
  actorName,
  recipientIds,
  type,
  message,
  entityType,
  entityId,
  meta = {},
}) => {
  const actor = String(actorId);
  const deduped = Array.from(
    new Set(
      (recipientIds || [])
        .map((recipientId) => String(recipientId))
        .filter((recipientId) => recipientId && recipientId !== actor)
    )
  );

  if (!deduped.length) return;

  await Notification.insertMany(
    deduped.map((recipientId) => ({
      recipient: recipientId,
      actor: actorId,
      actorName,
      type,
      message,
      entityType,
      entityId,
      meta,
    }))
  );
};
