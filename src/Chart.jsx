import { formatTime } from "./api";

export default function Chart({ readings, unit, start, end }) {
  const width = 860,
    height = 260,
    left = 62,
    right = 20,
    top = 24,
    bottom = 42;
  const values = readings.map((r) => r.value);
  const min = Math.min(...values),
    max = Math.max(...values);
  const pad = Math.max((max - min) * 0.2, 0.025);
  const low = min - pad,
    high = max + pad;
  const from = Date.parse(start),
    to = Date.parse(end);
  const x = (value) =>
    left + ((Date.parse(value) - from) / (to - from)) * (width - left - right);
  const y = (value) =>
    top + ((high - value) / (high - low)) * (height - top - bottom);
  const groups = [];
  readings.forEach((reading, index) => {
    // Break the line across gaps longer than an hour instead of implying continuity.
    if (
      !index ||
      Date.parse(reading.dateTime) - Date.parse(readings[index - 1].dateTime) >
        3600000
    )
      groups.push([]);
    groups.at(-1).push(reading);
  });
  return (
    <figure className="chart">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-labelledby="chart-title chart-description"
      >
        <title id="chart-title">Water level over the selected period</title>
        <desc id="chart-description">
          {readings.length} readings, from {formatTime(readings[0].dateTime)} to{" "}
          {formatTime(readings.at(-1).dateTime)}. Lowest {min.toFixed(3)},
          highest {max.toFixed(3)} {unit}. Exact readings are in the data table
          below.
        </desc>
        <defs>
          <linearGradient id="river-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#247f70" stopOpacity=".17" />
            <stop offset="100%" stopColor="#247f70" stopOpacity=".01" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((i) => {
          const value = low + ((high - low) * i) / 4;
          return (
            <g key={i}>
              <line
                x1={left}
                x2={width - right}
                y1={y(value)}
                y2={y(value)}
                stroke="#e5eae4"
                strokeDasharray="4 5"
              />
              <text x={left - 12} y={y(value) + 4} textAnchor="end">
                {value.toFixed(2)}
              </text>
            </g>
          );
        })}
        {groups.map((group, i) => {
          const path = group
            .map((r, j) => `${j ? "L" : "M"} ${x(r.dateTime)} ${y(r.value)}`)
            .join(" ");
          return (
            <g key={i}>
              <path
                d={`${path} L ${x(group.at(-1).dateTime)} ${height - bottom} L ${x(group[0].dateTime)} ${height - bottom} Z`}
                fill="url(#river-fill)"
              />
              <path
                d={path}
                fill="none"
                stroke="#247566"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              {group.length === 1 && (
                <circle
                  cx={x(group[0].dateTime)}
                  cy={y(group[0].value)}
                  r="4"
                  fill="#247566"
                />
              )}
            </g>
          );
        })}
        <circle
          cx={x(readings.at(-1).dateTime)}
          cy={y(readings.at(-1).value)}
          r="5"
          fill="#123f3c"
          stroke="white"
          strokeWidth="2"
        />
        {[0, 0.5, 1].map((ratio) => {
          const time = new Date(from + (to - from) * ratio).toISOString();
          return (
            <text
              key={ratio}
              x={x(time)}
              y={height - 12}
              textAnchor={
                ratio === 0 ? "start" : ratio === 1 ? "end" : "middle"
              }
            >
              {formatTime(time, true)}
            </text>
          );
        })}
      </svg>
      <figcaption>
        <span>
          <i className="legend-line" /> Water level ({unit})
        </span>
        <span>Times shown in UK local time</span>
      </figcaption>
    </figure>
  );
}
