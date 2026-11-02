import { useEffect, useMemo, useState } from "react";
import {
  apiUrl,
  asArray,
  CATALOGUE_LIMIT,
  cleanReadings,
  formatTime,
  getWindow,
  hasCoordinates,
  label,
  measuresFrom,
  READING_LIMIT,
  resourceUrl,
  stationKey,
  stationsFrom,
  summarise,
  toCsv,
  unitDescription,
} from "./api";
import { useResource } from "./useResource";
import Chart from "./Chart";

function Icon({ name, size = 20, ...props }) {
  const paths = {
    wave: (
      <>
        <path d="M2 8q5-6 10 0t10 0M2 16q5-6 10 0t10 0" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    pin: (
      <>
        <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
        <circle cx="12" cy="10" r="2" />
      </>
    ),
    arrow: <path d="m9 5 7 7-7 7" />,
    refresh: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M6 7a7 7 0 0 1 12-1l2 6M4 12l2 6a7 7 0 0 0 12-1" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6m0-10v1" />
      </>
    ),
    alert: (
      <>
        <path d="m12 3 10 18H2L12 3Z" />
        <path d="M12 9v5m0 3v1" />
      </>
    ),
    external: (
      <>
        <path d="M14 3h7v7M10 14 21 3M10 3H3v18h18v-7" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name] || paths.wave}
    </svg>
  );
}

function Loading({ children = "Fetching Environment Agency data…" }) {
  return (
    <div className="loading" role="status">
      <span className="spinner" />
      {children}
    </div>
  );
}
function Failure({ message, retry }) {
  return (
    <div className="failure" role="alert">
      <Icon name="info" />
      <div>
        <strong>Data unavailable</strong>
        <p>{message}</p>
        <button className="text-button" onClick={retry}>
          Try again <Icon name="refresh" size={15} />
        </button>
      </div>
    </div>
  );
}
function Empty({ title, children }) {
  return (
    <div className="empty">
      <Icon name="wave" size={30} />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}

function Alerts({ station }) {
  const [radius, setRadius] = useState(10);
  const [revision, setRevision] = useState(0);
  const located = hasCoordinates(station);
  const url = located
    ? apiUrl("id/floods", {
        lat: station.lat,
        long: station.long,
        dist: radius,
        "min-severity": 3,
        _limit: 2000,
      })
    : null;
  const { data, error, loading } = useResource(url, revision);
  const alerts = asArray(data?.items)
    .filter(
      (a) =>
        a &&
        Number.isInteger(a.severityLevel) &&
        a.severityLevel >= 1 &&
        a.severityLevel <= 3,
    )
    .sort((a, b) => a.severityLevel - b.severityLevel);
  return (
    <section className="panel alerts" aria-labelledby="alerts-heading">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Around this station</span>
          <h2 id="alerts-heading">Flood alerts & warnings</h2>
        </div>
        <label className="compact-label">
          Search radius
          <select
            aria-label="Flood alert search radius"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
          >
            {[10, 25, 50].map((n) => (
              <option value={n} key={n}>
                {n} km
              </option>
            ))}
          </select>
        </label>
      </div>
      {!located ? (
        <p>
          Coordinates are unavailable for this station, so nearby warnings
          cannot be searched.
        </p>
      ) : loading ? (
        <Loading>Checking nearby warning areas…</Loading>
      ) : error ? (
        <Failure message={error} retry={() => setRevision((r) => r + 1)} />
      ) : (
        data && (
          <>
            {alerts.length ? (
              <div className="warning-list">
                {alerts.map((a, i) => (
                  <details
                    className={`warning severity-${a.severityLevel}`}
                    key={a["@id"] || i}
                  >
                    <summary>
                      <Icon name="alert" />
                      <span>
                        <strong>
                          {label(a.severity, "Flood information")}
                        </strong>
                        <span>
                          {label(a.description, "Area details unavailable")}
                        </span>
                      </span>
                      <Icon name="arrow" size={16} />
                    </summary>
                    <div className="warning-body">
                      <p>
                        {label(
                          a.message,
                          "No further message was provided by the Environment Agency.",
                        )}
                      </p>
                      <small>
                        Message updated {formatTime(a.timeMessageChanged)}
                      </small>
                      <a
                        href="https://check-for-flooding.service.gov.uk/"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Check official flood information{" "}
                        <Icon name="external" size={14} />
                      </a>
                    </div>
                  </details>
                ))}
              </div>
            ) : (
              <div className="no-alerts">
                <Icon name="info" size={24} />
                <div>
                  <strong>No active warnings returned</strong>
                  <p>
                    No active alerts or warnings were returned for this search.
                    This does not mean there is no flood risk.
                  </p>
                </div>
              </div>
            )}
            {asArray(data.items).length >= 2000 && (
              <p className="notice">
                The response reached its result limit. Check the official
                service for full coverage.
              </p>
            )}
            <p className="data-note">
              Checked {formatTime(data.fetchedAt)}. The API approximates nearby
              areas; results may extend beyond {radius} km.
            </p>
          </>
        )
      )}
    </section>
  );
}

function Readings({ station, measure }) {
  const [hours, setHours] = useState(24);
  const [revision, setRevision] = useState(0);
  const window = useMemo(() => getWindow(hours), [hours, revision]);
  const url =
    resourceUrl(measure["@id"]) +
    "/readings?" +
    new URLSearchParams({
      since: window.start,
      _sorted: "true",
      _limit: READING_LIMIT,
    });
  const { data, error, loading } = useResource(url, revision);
  const readings = useMemo(
    () => cleanReadings(data?.items, window.start, window.end),
    [data, window],
  );
  const summary = summarise(readings);
  const unit = label(measure.unitName, "units");
  const old =
    summary && Date.now() - Date.parse(summary.latest.dateTime) > 3 * 3600000;
  function download() {
    const objectUrl = URL.createObjectURL(
      new Blob([toCsv(readings, unit)], { type: "text/csv;charset=utf-8;" }),
    );
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = `riverwatch-${String(station.stationReference || "station").replace(/[^a-zA-Z0-9_-]/g, "")}-${hours}h.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }
  return (
    <section className="panel readings" aria-labelledby="readings-heading">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">The bigger picture</span>
          <h2 id="readings-heading">Water level</h2>
        </div>
        <button
          className="icon-button"
          aria-label="Refresh readings"
          title="Refresh readings"
          onClick={() => setRevision((r) => r + 1)}
          disabled={loading}
        >
          <Icon name="refresh" />
        </button>
      </div>
      <div
        className="time-controls"
        role="group"
        aria-label="Reading time period"
      >
        {[6, 24, 72, 168].map((n) => (
          <button
            key={n}
            aria-pressed={hours === n}
            onClick={() => setHours(n)}
          >
            {n < 48 ? `${n} hours` : `${n / 24} days`}
          </button>
        ))}
      </div>
      {loading ? (
        <Loading>Loading water-level readings…</Loading>
      ) : error ? (
        <Failure message={error} retry={() => setRevision((r) => r + 1)} />
      ) : !summary ? (
        <Empty title="No readings in this period">
          Try a longer time period or another measurement. Some stations report
          with a delay.
        </Empty>
      ) : (
        <>
          <div className="metrics">
            <div className="metric main-metric">
              <span>Latest in this period</span>
              <strong>
                {summary.latest.value.toFixed(3)} <small>{unit}</small>
              </strong>
              <span>{formatTime(summary.latest.dateTime)}</span>
            </div>
            <div className="metric">
              <span>Change across readings</span>
              <strong>
                {summary.change === null
                  ? "—"
                  : `${summary.change > 0 ? "+" : ""}${summary.change.toFixed(3)}`}{" "}
                <small>{unit}</small>
              </strong>
              <span>
                {summary.change === null
                  ? "Only one reading available"
                  : "First to last available reading"}
              </span>
            </div>
            <div className="metric">
              <span>Range in this period</span>
              <strong className="range-value">
                {summary.min.toFixed(3)} – {summary.max.toFixed(3)}
              </strong>
              <span>{unit}</span>
            </div>
          </div>
          {old && (
            <p className="notice">
              <Icon name="info" size={16} />
              The latest reading shown is more than 3 hours old. Stations can
              report with a delay.
            </p>
          )}
          <Chart
            readings={readings}
            unit={unit}
            start={window.start}
            end={window.end}
          />
          <p className="data-note">
            {unitDescription(unit)} Values are not river depth. Gaps over an
            hour are shown as breaks in the chart.
          </p>
          {asArray(data.items).length >= READING_LIMIT && (
            <p className="notice">
              The API returned the maximum {READING_LIMIT} readings. This view
              may be incomplete; select a shorter period.
            </p>
          )}
          <div className="reading-actions">
            <span>
              {readings.length.toLocaleString("en-GB")} readings · fetched{" "}
              {formatTime(data.fetchedAt, true)}
            </span>
            <button className="text-button" onClick={download}>
              <Icon name="download" size={16} />
              Download CSV
            </button>
          </div>
          <details className="readings-table">
            <summary>
              View readings as a table <span>Newest first</span>
            </summary>
            <div
              className="table-scroll"
              role="region"
              aria-label="Water level readings"
              tabIndex="0"
            >
              <table>
                <caption>
                  Measurements at {label(station.label)}. Times shown in UK
                  local time.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Date and time</th>
                    <th scope="col">Level ({unit})</th>
                  </tr>
                </thead>
                <tbody>
                  {[...readings].reverse().map((r) => (
                    <tr key={r.dateTime}>
                      <td>{formatTime(r.dateTime)}</td>
                      <td>{r.value.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </section>
  );
}

function StationDetail({ selected }) {
  const [revision, setRevision] = useState(0);
  const { data, error, loading } = useResource(stationKey(selected), revision);
  const station = data?.items && !Array.isArray(data.items) ? data.items : null;
  const measures = measuresFrom(station);
  const [chosenMeasure, setChosenMeasure] = useState("");
  const measure =
    measures.find((m) => m["@id"] === chosenMeasure) || measures[0];
  return (
    <div className="station-content">
      <div className="station-title">
        <div>
          <span className="eyebrow">
            <Icon name="pin" size={14} /> Selected station
          </span>
          <h2>{label(selected.label)}</h2>
          <p>
            {label(selected.riverName, "River not supplied")}
            <span className="separator">/</span>
            {label(selected.town, "Town not supplied")}
          </p>
        </div>
        <span className="station-id">
          {label(selected.stationReference, "EA station")}
        </span>
      </div>
      {loading ? (
        <div className="panel">
          <Loading>Loading station details…</Loading>
        </div>
      ) : error ? (
        <div className="panel">
          <Failure message={error} retry={() => setRevision((r) => r + 1)} />
        </div>
      ) : station ? (
        <>
          <div className="measurement-bar">
            <label htmlFor="measure">
              Measurement
              <select
                id="measure"
                value={measure?.["@id"] || ""}
                onChange={(e) => setChosenMeasure(e.target.value)}
                disabled={!measures.length}
              >
                {measures.length ? (
                  measures.map((m) => (
                    <option key={m["@id"]} value={m["@id"]}>
                      {label(m.qualifier, "Water level")} ·{" "}
                      {label(m.unitName, "units")}
                    </option>
                  ))
                ) : (
                  <option>No level measurements</option>
                )}
              </select>
            </label>
            <span>
              {label(station.catchmentName, "Catchment not supplied")}
              <small>Catchment area</small>
            </span>
          </div>
          {measure ? (
            <Readings
              key={measure["@id"]}
              station={station}
              measure={measure}
            />
          ) : (
            <section className="panel">
              <Empty title="No level measurement available">
                Try another station.
              </Empty>
            </section>
          )}
          <Alerts station={station} />
          <details className="station-metadata">
            <summary>Station details & data source</summary>
            <dl>
              <div>
                <dt>Station reference</dt>
                <dd>{label(station.stationReference)}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  {typeof station.status === "string"
                    ? station.status.split("status").at(-1)
                    : "Not supplied"}
                </dd>
              </div>
              <div>
                <dt>Coordinates</dt>
                <dd>
                  {hasCoordinates(station)
                    ? `${station.lat.toFixed(5)}, ${station.long.toFixed(5)}`
                    : "Not supplied"}
                </dd>
              </div>
              <div>
                <dt>Catchment</dt>
                <dd>{label(station.catchmentName)}</dd>
              </div>
            </dl>
            <a href={stationKey(selected)} target="_blank" rel="noreferrer">
              View the station’s source data <Icon name="external" size={14} />
            </a>
            {hasCoordinates(station) && (
              <a
                href={`https://www.openstreetmap.org/?mlat=${station.lat}&mlon=${station.long}#map=14/${station.lat}/${station.long}`}
                target="_blank"
                rel="noreferrer"
              >
                Locate on OpenStreetMap <Icon name="external" size={14} />
              </a>
            )}
          </details>
        </>
      ) : (
        <div className="panel">
          <Failure
            message="The service returned no station details."
            retry={() => setRevision((r) => r + 1)}
          />
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [river, setRiver] = useState("River Thames");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState({ river: "River Thames", search: "" });
  const [revision, setRevision] = useState(0);
  const [catalogueRevision, setCatalogueRevision] = useState(0);
  const catalogue = useResource(
    apiUrl("id/stations", { parameter: "level", _limit: CATALOGUE_LIMIT }),
    catalogueRevision,
  );
  const rivers = useMemo(
    () =>
      [
        ...new Set([
          "River Thames",
          ...asArray(catalogue.data?.items)
            .map((s) => label(s?.riverName, ""))
            .filter(Boolean),
        ]),
      ].sort(),
    [catalogue.data],
  );
  const stationsRequest = useResource(
    apiUrl("id/stations", {
      parameter: "level",
      riverName: query.river,
      search: query.search,
      _limit: CATALOGUE_LIMIT,
    }),
    revision,
  );
  const stations = useMemo(
    () => stationsFrom(stationsRequest.data?.items),
    [stationsRequest.data],
  );
  const [selected, setSelected] = useState(null);
  const [visible, setVisible] = useState(12);
  const [about, setAbout] = useState(false);
  useEffect(() => {
    if (!stationsRequest.data) return;
    setSelected(
      (current) =>
        stations.find((s) => stationKey(s) === stationKey(current)) ||
        stations[0] ||
        null,
    );
    setVisible(12);
  }, [stationsRequest.data, stations]);
  function findStations(event) {
    event.preventDefault();
    setSelected(null);
    setQuery({ river, search: search.trim() });
    setRevision((r) => r + 1);
  }
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#">
            <span className="brand-mark">
              <Icon name="wave" size={24} />
            </span>
            riverwatch<span className="brand-dot">.</span>
          </a>
          <nav aria-label="Main navigation">
            <a href="#explorer" className="nav-current">
              Explore rivers
            </a>
            <button
              className="nav-button"
              aria-expanded={about}
              aria-controls="about"
              onClick={() => setAbout((v) => !v)}
            >
              About the data <Icon name="info" size={16} />
            </button>
          </nav>
          <span className="header-tag">Public data. A clearer picture.</span>
        </div>
      </header>
      <main id="main">
        <section className="hero">
          <div>
            <p className="eyebrow">
              <span className="small-dot" /> England’s rivers, in view
            </p>
            <h1>
              A closer look
              <br />
              at your river.
            </h1>
            <p className="hero-description">
              Explore water levels, follow recent changes and check
              <br className="desktop-break" /> flood information around a
              monitoring station.
            </p>
          </div>
          <div className="hero-art" aria-hidden="true">
            <svg viewBox="0 0 390 200" fill="none">
              <g stroke="#a7c5b4" strokeWidth="1.1">
                {Array.from({ length: 12 }, (_, i) => (
                  <path
                    key={i}
                    d={`M${-30 + i * 12} -20 C ${220 + i * 9} 30, ${-130 + i * 14} 130, ${240 + i * 10} 230`}
                  />
                ))}
              </g>
              <path
                d="M145 -20C370 35 10 130 340 220"
                stroke="#427f70"
                strokeWidth="8"
              />
              <circle cx="194" cy="75" r="15" fill="#f6f7ef" stroke="#427f70" />
              <circle cx="194" cy="75" r="5" fill="#427f70" />
            </svg>
            <span>
              <Icon name="wave" size={18} /> Environment Agency data
            </span>
          </div>
        </section>
        {about && (
          <section id="about" className="about panel">
            <h2>Understanding the data</h2>
            <p>
              Riverwatch is an independent learning project using the
              Environment Agency’s public flood-monitoring API. Coverage focuses
              on England. No account, API key or database is needed.
            </p>
            <p>
              Measurements are usually taken every 15 minutes, but stations may
              send them in batches. A fetched response may contain older
              readings. Station heights use different reference levels and
              should not be compared directly. No forecast or flood-risk rating
              is calculated from the readings.
            </p>
            <p>
              The chart uses the requested time window, omits invalid or
              ambiguous readings, and breaks across gaps over an hour. CSV
              downloads contain the same readings with UTC timestamps.
            </p>
            <a
              href="https://environment.data.gov.uk/flood-monitoring/doc/reference"
              target="_blank"
              rel="noreferrer"
            >
              Read the API documentation <Icon name="external" size={14} />
            </a>
          </section>
        )}
        <div className="official-notice">
          <Icon name="info" size={18} />
          <p>
            For current flood advice and warnings, use the official service.
            Riverwatch is for exploring data.
          </p>
          <a
            href="https://check-for-flooding.service.gov.uk/"
            target="_blank"
            rel="noreferrer"
          >
            Check for flooding <Icon name="external" size={14} />
          </a>
        </div>
        <div className="explorer" id="explorer">
          <aside className="sidebar" aria-label="Find a monitoring station">
            <div className="search-panel">
              <span className="eyebrow">Start exploring</span>
              <h2>Find a station</h2>
              <form onSubmit={findStations}>
                <label htmlFor="river">
                  River
                  <select
                    id="river"
                    value={river}
                    onChange={(e) => setRiver(e.target.value)}
                  >
                    <option value="">All rivers</option>
                    {rivers.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </label>
                <label htmlFor="station-search">
                  Station name
                  <span className="input-wrap">
                    <Icon name="search" size={17} />
                    <input
                      id="station-search"
                      placeholder="e.g. Kingston"
                      value={search}
                      maxLength={100}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </span>
                </label>
                <button
                  className="primary-button"
                  type="submit"
                  disabled={stationsRequest.loading}
                >
                  <Icon name="search" size={18} />
                  Find stations
                </button>
              </form>
              {catalogue.loading && (
                <p className="data-note">Loading river choices…</p>
              )}
              {catalogue.error && (
                <p className="data-note">
                  River choices could not load. You can still search station
                  names using “All rivers”.{" "}
                  <button
                    className="text-button"
                    onClick={() => setCatalogueRevision((r) => r + 1)}
                  >
                    Retry river list
                  </button>
                </p>
              )}
              {asArray(catalogue.data?.items).length >= CATALOGUE_LIMIT && (
                <p className="data-note">
                  River choices may be incomplete. Use “All rivers” to search by
                  station name.
                </p>
              )}
            </div>
            <div className="station-results">
              <div className="results-heading">
                <h3>Monitoring stations</h3>
                <span aria-live="polite">
                  {stationsRequest.loading ? "…" : stations.length}
                </span>
              </div>
              {!stationsRequest.loading && (
                <p className="results-context">
                  {query.river || "All rivers"}
                  {query.search ? ` · “${query.search}”` : ""}
                </p>
              )}
              {stationsRequest.loading ? (
                <Loading>Finding stations…</Loading>
              ) : stationsRequest.error ? (
                <Failure
                  message={stationsRequest.error}
                  retry={() => setRevision((r) => r + 1)}
                />
              ) : stations.length === 0 ? (
                <Empty title="No stations found">
                  Try a different station name or select “All rivers”.
                </Empty>
              ) : (
                <>
                  <ul className="station-list">
                    {stations.slice(0, visible).map((s) => (
                      <li key={stationKey(s)}>
                        <button
                          className={
                            stationKey(selected) === stationKey(s)
                              ? "station active"
                              : "station"
                          }
                          aria-pressed={stationKey(selected) === stationKey(s)}
                          onClick={() => setSelected(s)}
                        >
                          <span className="station-symbol">
                            <Icon name="pin" size={18} />
                          </span>
                          <span className="station-text">
                            <strong>{label(s.label)}</strong>
                            <span>
                              {label(s.riverName, "River not supplied")}
                            </span>
                          </span>
                          <Icon name="arrow" size={15} />
                        </button>
                      </li>
                    ))}
                  </ul>
                  {visible < stations.length && (
                    <button
                      className="load-more"
                      onClick={() => setVisible((v) => v + 12)}
                    >
                      Show more ({stations.length - visible} remaining)
                    </button>
                  )}
                  {asArray(stationsRequest.data?.items).length >=
                    CATALOGUE_LIMIT && (
                    <p className="data-note">
                      Result limit reached. Narrow your search.
                    </p>
                  )}
                </>
              )}
            </div>
            <p className="sidebar-note">
              <Icon name="info" size={16} />
              Select a station to explore its measurements and nearby warning
              areas.
            </p>
          </aside>
          {selected ? (
            <StationDetail key={stationKey(selected)} selected={selected} />
          ) : (
            <div className="panel choose-station">
              <Empty
                title={
                  stationsRequest.loading
                    ? "Finding your river"
                    : "Choose a monitoring station"
                }
              >
                Search by river or station name to start exploring the data.
              </Empty>
            </div>
          )}
        </div>
      </main>
      <footer>
        <div>
          <span className="footer-brand">
            <Icon name="wave" size={20} />
            riverwatch.
          </span>
          <p>
            This uses Environment Agency flood and river level data from the
            real-time data API (Beta).
          </p>
        </div>
        <div>
          <a
            href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/"
            target="_blank"
            rel="noreferrer"
          >
            Open Government Licence v3.0
          </a>
          <span>Independent project · JCS Module 1b</span>
        </div>
      </footer>
    </>
  );
}
