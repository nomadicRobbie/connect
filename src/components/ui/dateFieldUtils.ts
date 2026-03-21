function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function calendarDateFromIso(isoString?: string) {
  if (!isoString) return "";

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function isoStringFromCalendarDate(calendarDate: string) {
  if (!calendarDate) return undefined;

  const [year, month, day] = calendarDate.split("-").map(Number);
  if (!year || !month || !day) return undefined;

  return new Date(Date.UTC(year, month - 1, day)).toISOString();
}

export function localDateFromIso(isoString?: string) {
  const calendarDate = calendarDateFromIso(isoString);
  if (!calendarDate) {
    return new Date();
  }

  const [year, month, day] = calendarDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function isoStringFromLocalDate(date: Date) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString();
}

export function formatIsoAsDisplayDate(isoString?: string) {
  const calendarDate = calendarDateFromIso(isoString);
  if (!calendarDate) return "Select a date";

  const [year, month, day] = calendarDate.split("-").map(Number);
  const localDate = new Date(year, month - 1, day);

  return localDate.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
