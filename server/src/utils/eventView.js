import { getEventStatus } from "./date.js";

export const toEventView = (event, options = {}) => {
  const {
    registrationCount = 0,
    isRegistered = false,
    canManage = false,
    canControlRegistration = false,
    isClubMember = false,
  } = options;

  const maxParticipants = Number(event.maxParticipants || 0);
  const hasCapacityLimit = Number.isFinite(maxParticipants) && maxParticipants > 0;
  const spotsLeft = hasCapacityLimit ? Math.max(maxParticipants - registrationCount, 0) : null;
  const registrationDeadline = event.registrationDeadline || null;
  const deadlinePassed = registrationDeadline ? new Date(registrationDeadline).getTime() < Date.now() : false;

  let registrationState = "open";
  if (event.registrationClosed) {
    registrationState = "closed_by_manager";
  } else if (deadlinePassed) {
    registrationState = "deadline_passed";
  } else if (hasCapacityLimit && registrationCount >= maxParticipants) {
    registrationState = "full";
  }

  const registrationOpen = registrationState === "open";

  return {
    id: event._id,
    club: event.club,
    title: event.title,
    description: event.description,
    category: event.category,
    date: event.date,
    venue: event.venue,
    posterUrl: event.posterUrl,
    maxParticipants,
    spotsLeft,
    registrationDeadline,
    registrationClosed: Boolean(event.registrationClosed),
    registrationOpen,
    registrationState,
    createdBy: event.createdBy,
    status: getEventStatus(event.date),
    registrationCount,
    isRegistered,
    isClubMember,
    canManage,
    canControlRegistration,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
};
