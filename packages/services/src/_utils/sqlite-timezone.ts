const getTimezoneOffsetMinutes = (timeZone: string, date: Date) => {
  const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
  const tzDate = new Date(date.toLocaleString("en-US", { timeZone }));
  return Math.round((tzDate.getTime() - utcDate.getTime()) / 60_000);
};

export const sqliteTimezoneModifier = (timeZone: string, date: Date) => {
  const offsetMinutes = getTimezoneOffsetMinutes(timeZone, date);
  if (offsetMinutes === 0) {
    return "utc";
  }
  const sign = offsetMinutes > 0 ? "+" : "";
  return `${sign}${offsetMinutes} minutes`;
};

export const sqliteDateTruncFormat = (datePart: "day" | "month") => {
  return datePart === "month" ? "%Y-%m-01" : "%Y-%m-%d";
};
