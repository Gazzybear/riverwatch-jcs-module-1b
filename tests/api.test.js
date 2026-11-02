import test from "node:test";
import assert from "node:assert/strict";
import {
  apiUrl,
  cleanReadings,
  fetchData,
  getWindow,
  hasCoordinates,
  label,
  measuresFrom,
  resourceUrl,
  stationsFrom,
  summarise,
  toCsv,
} from "../src/api.js";

test("encodes river and station input without injecting extra query parameters", () => {
  const url = new URL(
    apiUrl("id/stations", {
      riverName: "River A & B",
      search: "bridge?x=1",
      unused: "",
    }),
  );
  assert.equal(url.protocol, "https:");
  assert.equal(url.searchParams.get("riverName"), "River A & B");
  assert.equal(url.searchParams.get("search"), "bridge?x=1");
  assert.equal(url.searchParams.size, 2);
});
test("upgrades EA identifiers but rejects unrelated or credential-bearing URLs", () => {
  assert.equal(
    resourceUrl(
      "http://environment.data.gov.uk/flood-monitoring/id/stations/123",
    ),
    "https://environment.data.gov.uk/flood-monitoring/id/stations/123",
  );
  for (const value of [
    "javascript:alert(1)",
    "https://example.com/flood-monitoring/id/123",
    "https://environment.data.gov.uk.evil.test/flood-monitoring/id/123",
    "https://user@environment.data.gov.uk/flood-monitoring/id/123",
    "https://environment.data.gov.uk/elsewhere",
    undefined,
  ]) {
    assert.equal(resourceUrl(value), null);
  }
});
test("cleans readings without inventing values, respects window, sorts and deduplicates", () => {
  const input = [
    { dateTime: "2026-11-02T12:00Z", value: 0 },
    { dateTime: "2026-11-02T11:00Z", value: -0.2 },
    { dateTime: "2026-11-02T12:00Z", value: 0.1 },
    { dateTime: "2026-11-02T11:30Z", value: [1, 2] },
    { dateTime: "bad", value: 3 },
    { dateTime: "2026-11-02T10:00Z", value: 99 },
    { dateTime: "2026-11-02T13:00Z", value: 99 },
    { dateTime: "2026-11-02T11:15Z", value: "0.3" },
    { dateTime: "2026-11-02T11:45Z", value: null },
  ];
  const clean = cleanReadings(input, "2026-11-02T11:00Z", "2026-11-02T12:00Z");
  assert.deepEqual(
    clean.map((r) => r.value),
    [-0.2, 0.1],
  );
  assert.equal(summarise(clean).latest.value, 0.1);
  assert.ok(Math.abs(summarise(clean).change - 0.3) < 1e-10);
});
test("no readings are distinct from a zero reading, and one reading has no change", () => {
  assert.equal(summarise([]), null);
  const summary = summarise([{ dateTime: "2026-11-02T12:00Z", value: 0 }]);
  assert.equal(summary.latest.value, 0);
  assert.equal(summary.change, null);
});
test("time windows use elapsed hours across UK daylight saving changes", () => {
  const range = getWindow(24, Date.parse("2026-10-25T12:00:00Z"));
  assert.equal(range.start, "2026-10-24T12:00:00.000Z");
  assert.equal(Date.parse(range.end) - Date.parse(range.start), 86400000);
});
test("normalises single measurements and chooses station-datum stage first", () => {
  const base = "http://environment.data.gov.uk/flood-monitoring/id/measures/";
  const a = {
    "@id": base + "a",
    parameter: "level",
    qualifier: "Stage",
    unitName: "mAOD",
  };
  const b = {
    "@id": base + "b",
    parameter: "level",
    qualifier: "Stage",
    unitName: "mASD",
  };
  assert.equal(measuresFrom({ measures: [a, b] })[0], b);
  assert.deepEqual(measuresFrom({ measures: a }), [a]);
  assert.deepEqual(measuresFrom({ measures: { ...a, parameter: "flow" } }), []);
});
test("station list removes duplicates and invalid identifiers and sorts labels", () => {
  const make = (id, title) => ({
    "@id": `http://environment.data.gov.uk/flood-monitoring/id/stations/${id}`,
    label: title,
  });
  const a = make("1", "Zulu"),
    b = make("2", "Alpha");
  assert.deepEqual(stationsFrom([a, b, a, { label: "Missing" }, null]), [b, a]);
  assert.equal(label(["One", "Two"]), "One / Two");
});
test("coordinate validation accepts zero and rejects missing or invalid coordinates", () => {
  assert.equal(hasCoordinates({ lat: 51, long: 0 }), true);
  assert.equal(hasCoordinates({ lat: 51 }), false);
  assert.equal(hasCoordinates({ lat: 100, long: 1 }), false);
});
test("CSV includes UTC timestamps, quotes unit text and preserves negative values", () => {
  const csv = toCsv(
    [{ dateTime: "2026-11-02T12:00:00.000Z", value: -0.1 }],
    "m",
  );
  assert.match(csv, /timestamp_utc/);
  assert.match(csv, /2026-11-02T12:00:00.000Z/);
  assert.match(csv, /"-0.1"/);
});
test("empty valid API responses stay empty rather than being treated as outages", async () => {
  const result = await fetchData("https://example.test", null, async () => ({
    ok: true,
    json: async () => ({ items: [] }),
  }));
  assert.deepEqual(result.items, []);
  assert.ok(result.fetchedAt);
});
test("HTTP, network and malformed responses have clear recoverable errors", async () => {
  await assert.rejects(
    fetchData("https://example.test", null, async () => ({
      ok: false,
      status: 503,
    })),
    /HTTP 503/,
  );
  await assert.rejects(
    fetchData("https://example.test", null, async () => {
      throw new TypeError("Failed to fetch");
    }),
    /Check your connection/,
  );
  await assert.rejects(
    fetchData("https://example.test", null, async () => ({
      ok: true,
      json: async () => ({ nope: [] }),
    })),
    /unexpected response/,
  );
});
