export const toStartOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const toEndOfDay = (value) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

export const getEventStatus = (eventDateInput) => {
  const eventDate = new Date(eventDateInput);
  const todayStart = toStartOfDay(new Date());
  const todayEnd = toEndOfDay(new Date());

  if (eventDate < todayStart) return "completed";
  if (eventDate > todayEnd) return "upcoming";
  return "ongoing";
};
