// All network requests go directly to this public Government HTTPS API.
export const API_ROOT = "https://environment.data.gov.uk/flood-monitoring";
export const CATALOGUE_LIMIT = 10000;
export const READING_LIMIT = 2000;

export function apiUrl(path, parameters = {}) {
  const url = new URL(`${API_ROOT}/${path.replace(/^\//, "")}`);
  for (const [key, value] of Object.entries(parameters)) {
    if (value !== "" && value !== undefined && value !== null)
      url.searchParams.set(key, value);
  }
  return url.href;
}

// Identifiers returned by the API sometimes use HTTP. Upgrade only trusted IDs.
export function resourceUrl(id) {
  try {
    const url = new URL(id);
    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.hostname !== "environment.data.gov.uk" ||
      url.port ||
      url.username ||
      url.password ||
      !url.pathname.startsWith("/flood-monitoring/id/")
    )
      return null;
    url.protocol = "https:";
    url.search = "";
    url.hash = "";
    return url.href;
  } catch {
    return null;
  }
}

export async function fetchData(url, signal, fetcher = fetch) {
  const timeout = AbortSignal.timeout(20000);
  try {
    const response = await fetcher(url, {
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
    if (!response.ok)
      throw new Error(
        `The Environment Agency returned HTTP ${response.status}. Please try again.`,
      );
    const body = await response.json();
    if (
      !body ||
      !("items" in body) ||
      body.items === null ||
      typeof body.items !== "object"
    ) {
      throw new Error(
        "The data service returned an unexpected response. Please try again.",
      );
    }
    return {
      items: body.items,
      meta: body.meta ?? {},
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    if (signal?.aborted) throw error;
    if (timeout.aborted)
      throw new Error(
        "The data service took too long to respond. Please try again.",
      );
    if (error instanceof TypeError)
      throw new Error(
        "Could not reach the Environment Agency. Check your connection and try again.",
      );
    throw error;
  }
}

export function asArray(value) {
  return Array.isArray(value) ? value : value ? [value] : [];
}
export function label(value, fallback = "Not supplied") {
  return typeof value === "string"
    ? value
    : Array.isArray(value)
      ? value.filter((v) => typeof v === "string").join(" / ") || fallback
      : fallback;
}
export function stationKey(station) {
  return resourceUrl(station?.["@id"]);
}
export function stationsFrom(items) {
  const unique = new Map();
  for (const station of asArray(items)) {
    if (station && stationKey(station))
      unique.set(stationKey(station), station);
  }
  return [...unique.values()].sort((a, b) =>
    label(a.label).localeCompare(label(b.label), "en-GB"),
  );
}

export function measuresFrom(station) {
  return asArray(station?.measures)
    .filter((m) => m?.parameter === "level" && resourceUrl(m["@id"]))
    .sort(
      (a, b) =>
        (a.qualifier === "Stage" ? 0 : 1) - (b.qualifier === "Stage" ? 0 : 1) ||
        (a.unitName === "mASD" ? 0 : 1) - (b.unitName === "mASD" ? 0 : 1),
    );
}

export function cleanReadings(items, start, end) {
  const unique = new Map();
  for (const item of asArray(items)) {
    const time = Date.parse(item?.dateTime);
    // Multiple values at one timestamp are ambiguous; never silently average them.
    if (
      !Number.isFinite(time) ||
      typeof item.value !== "number" ||
      !Number.isFinite(item.value)
    )
      continue;
    if ((start && time < Date.parse(start)) || (end && time > Date.parse(end)))
      continue;
    unique.set(time, {
      dateTime: new Date(time).toISOString(),
      value: item.value,
    });
  }
  return [...unique.values()].sort(
    (a, b) => Date.parse(a.dateTime) - Date.parse(b.dateTime),
  );
}

export function getWindow(hours, now = Date.now()) {
  return {
    start: new Date(now - hours * 3600000).toISOString(),
    end: new Date(now).toISOString(),
  };
}
export function summarise(readings) {
  if (!readings.length) return null;
  const values = readings.map((r) => r.value);
  return {
    latest: readings.at(-1),
    min: Math.min(...values),
    max: Math.max(...values),
    change: readings.length > 1 ? values.at(-1) - values[0] : null,
  };
}
export function hasCoordinates(station) {
  return (
    Number.isFinite(station?.lat) &&
    Number.isFinite(station?.long) &&
    Math.abs(station.lat) <= 90 &&
    Math.abs(station.long) <= 180
  );
}
export function formatTime(value, compact = false) {
  if (!value || !Number.isFinite(Date.parse(value))) return "Not supplied";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    ...(compact ? {} : { timeZoneName: "short" }),
  }).format(new Date(value));
}
export function unitDescription(unit) {
  if (unit === "mASD")
    return "Metres above station datum (a local reference level).";
  if (unit === "mAOD")
    return "Metres above Ordnance Datum (a national height reference).";
  if (unit === "m") return "Metres, as reported by the station.";
  return `Unit reported by the station: ${unit || "not supplied"}.`;
}
export function toCsv(readings, unit) {
  const cell = (value) => `"${String(value).replaceAll('"', '""')}"`;
  return (
    "\uFEFF" +
    [
      ["timestamp_utc", `level_${unit}`],
      ...readings.map((r) => [r.dateTime, r.value]),
    ]
      .map((row) => row.map(cell).join(","))
      .join("\r\n")
  );
}
