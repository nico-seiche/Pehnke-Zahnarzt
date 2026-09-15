/** Today's German weekday label (e.g. "Montag"), used to highlight the current row in opening-hours tables. */
export function getTodayLabel(timeZone = "Europe/Berlin") {
  return new Intl.DateTimeFormat("de-DE", { timeZone, weekday: "long" }).format(new Date());
}

export function findTodayIndex(rows: { day?: string | null }[] | null | undefined, timeZone = "Europe/Berlin") {
  if (!rows?.length) {
    return -1;
  }

  const today = getTodayLabel(timeZone).toLowerCase();
  return rows.findIndex((row) => row.day?.toLowerCase() === today);
}
