# Understanding Riverwatch

Use this guide with the code open and the application running. The aim is to be able to explain the decisions and make changes yourself.

## Follow one complete interaction

1. In `App.jsx`, `river` and `search` hold the form's current values. `query` holds the submitted search. Keeping them separate avoids a network request on every keystroke.
2. Submitting the form updates `query`. `apiUrl()` safely encodes the values into a Government API URL.
3. `useResource()` notices the URL change, starts a fetch and exposes its loading, error or data state.
4. The returned station list becomes buttons. Selecting one changes `selected` and mounts `StationDetail` for its API identifier.
5. Station details supply measurement identifiers. Selecting a measurement mounts `Readings`, which builds a new request using `since` and the chosen time window.
6. `cleanReadings()` rejects unusable values and sorts the response. `summarise()` computes the displayed numbers. `Chart` renders the same records; the table and CSV use them too.
7. `Alerts` uses the station coordinates and the chosen radius to request nearby flood warnings separately. A warning-service error does not prevent the readings from being displayed.

## Trace the Government API requests

| User action | Request path under the API root | Purpose |
| --- | --- | --- |
| Open the app | `/id/stations?parameter=level&_limit=10000` | Populate river choices from Government data |
| Find stations | `/id/stations?parameter=level&riverName=…&search=…` | Request matching monitoring stations |
| Select a station | `/id/stations/{station-id}` | Retrieve its measurement identifiers and metadata |
| Select a measure or period | `/id/measures/{measure-id}/readings?since=…&_sorted=true&_limit=2000` | Request readings for that measure and time window |
| Change warning radius | `/id/floods?lat=…&long=…&dist=…&min-severity=3` | Request nearby active warning areas |

The root is `https://environment.data.gov.uk/flood-monitoring`. Resource identifiers can arrive as HTTP strings; `resourceUrl()` upgrades identifiers on the trusted Government host to HTTPS before use.

## React concepts used here

- **Components:** `App`, `StationDetail`, `Readings`, `Alerts` and `Chart` divide the screen by responsibility.
- **State:** `useState` stores selections, submitted inputs and refresh counters. Updating state triggers rendering.
- **Effects:** `useEffect` performs a fetch when its dependencies change and cancels it when that request becomes obsolete.
- **Derived values:** `useMemo` avoids repeatedly transforming a catalogue or readings array unless its inputs change. It is not a database.
- **Keys:** A new station or measurement key resets dependent controls so that another station's readings cannot be presented under the wrong name.
- **Conditional rendering:** Loading, errors, empty results and real data have separate visible states. Zero is a valid measurement, so it is not treated as an empty response.

## Why request cancellation matters

Suppose station A takes five seconds to respond, while station B takes one second. If the user selects B before A finishes, A's later response must not overwrite B's data. `AbortController` cancels the obsolete request. The hook also compares request keys before exposing data, avoiding a brief mismatch before the next effect starts.

## Explain these data decisions

- A measurement's timestamp tells you when the water level was measured. The fetch timestamp tells you when the app received a response. These can differ substantially.
- A negative height or a zero height can be valid. Missing data is represented by no reading, not by zero.
- Stage measurements use a reference height, not the riverbed. They are not water depth or a flood forecast.
- API warnings are used as supplied. The app does not calculate a risk score from a rising river line.
- CSV dates use UTC to avoid ambiguity when the clocks change. Display dates use `Europe/London`.
- A line is broken over missing time spans rather than silently interpolated. The table gives the exact points.

## Practical review exercises

Complete these yourself and record what you changed in `ASSISTANCE.md` if you use them in your submission.

1. Explain which state changes when a user types, presses Find stations and selects a result. Point to the corresponding API calls in the browser's Network panel.
2. Change the default river to another API-provided name, then test the first station selection.
3. Add a 48-hour period option. Explain why this changes the `since` parameter and why the returned count may differ from the theoretical number of samples.
4. Explain the units for two measurements at the same station and why their absolute values can differ.
5. Temporarily take the browser offline, retry a request and verify the error message. Restore connectivity and retry successfully.
6. Read each automated test, predict its result and explain one edge case it catches.
7. Open the app on a phone-sized viewport and operate it using only the keyboard where applicable. Check labels, focus indicators and the readings table.

Do not merely memorise these explanations. The final declaration should reflect your actual understanding and contribution, as well as the assessors' rules on assistance.
