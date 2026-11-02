# Riverwatch

A responsive React application for exploring England's river-level measurements and nearby flood alerts using the Environment Agency's public HTTPS API. Built as an AI-assisted learning project for JCS Module 1b.

## Run locally

Install Node.js 22.12 or newer and npm. From this folder:

```sh
npm ci
npm run dev
```

Open the localhost URL printed in the terminal. No API key, environment file, backend service or database is required. Internet access is needed to retrieve Government data. Do not open `index.html` directly from the filesystem.

```sh
npm test          # Data handling and request error tests
npm run build    # Create the static production site in dist/
npm run preview  # Serve that production build locally
```

`package-lock.json` locks dependency versions. `node_modules/` and `dist/` are excluded from Git; the marker installs dependencies with `npm ci`. The application uses React and Vite, both open-source frameworks/tools.

## Explore

1. Choose a river, optionally enter a station name, then press **Find stations**. Select **All rivers** when the river is unknown. River names come from the API's station catalogue.
2. Select a station. Its details and available measurements are fetched from the API.
3. Choose a measurement and select 6 hours, 24 hours, 3 days or 7 days. Each change fetches the relevant readings. **Refresh readings** advances the time window and requests updated data.
4. Inspect the chart, open the accessible data table or download those readings as CSV.
5. Change the nearby-warning radius to request alerts for a different area. Expand any returned alert to read the Environment Agency's message.

The first alphabetical station is selected automatically after a search. On a small screen the station list scrolls horizontally; **Show more** reveals further results.

## Data and limitations

- Data source: [Environment Agency flood-monitoring API](https://environment.data.gov.uk/flood-monitoring/doc/reference), licensed under the [Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/).
- Attribution: This uses Environment Agency flood and river level data from the real-time data API (Beta).
- Coverage focuses on England. Readings may be transmitted in batches; the fetch time is separate from the measurement timestamp.
- Heights are not river depth. `mASD` is metres above the station's local datum; `mAOD` is metres above Ordnance Datum. Measurements with different reference levels are kept separate.
- A three-hour-old reading receives an explanatory note. This is an application display threshold, not an Environment Agency quality assessment.
- Charts break across gaps longer than an hour. Invalid, nonnumeric and multiple-valued readings are omitted. Duplicate timestamps retain the last returned numeric value. No values are interpolated or fabricated.
- Up to 10,000 raw station records and 2,000 readings are requested per response. The UI warns if these limits are reached. Reading responses are sorted by the API, then filtered to the requested window and sorted chronologically in the app.
- Nearby warnings use the API's approximate geographic filter, which can include areas outside the selected radius. A successful empty response means no warnings were returned, not that an area is safe.
- The app makes no forecast and is not a safety-critical service. Use [GOV.UK Check for flooding](https://check-for-flooding.service.gov.uk/) for official advice.
- API failures and timeouts show retry controls. Responses from an old selection are cancelled and cannot overwrite the current selection.
- The app stores no user information, uses no database and does not request geolocation. Google Fonts supplies optional typefaces; system fonts are the fallback. External map and official-service links open only when selected.

## Project files

| File | Responsibility |
| --- | --- |
| `src/App.jsx` | Search form, station selection, measurement controls, readings and warnings |
| `src/api.js` | HTTPS URLs, requests, validation, formatting, summaries and CSV |
| `src/useResource.js` | Loading, error and request cancellation state |
| `src/Chart.jsx` | SVG chart with a text alternative and explicit gaps |
| `src/styles.css` | Desktop, tablet and mobile layouts, focus states and reduced motion |
| `tests/api.test.js` | Data and error-handling regression checks |
| `docs/ASSESSMENT.md` | Marking-scheme mapping and submission checklist |
| `docs/LEARNING-GUIDE.md` | Explanation of the implementation and review exercises |
| `docs/ASSISTANCE.md` | Honest record of AI assistance and third-party sources |
| `docs/VERIFICATION.md` | Recorded validation and its limits |

## Hosting and source submission

This is a static Vite application. A host needs build command `npm ci && npm run build` and output directory `dist`. `.openai/hosting.json` identifies the private Sites deployment; it is not needed to run the project locally.

Source repository: [Gazzybear/riverwatch-jcs-module-1b](https://github.com/Gazzybear/riverwatch-jcs-module-1b) (private).

For assessment, ensure the marker can access this repository. A private preview alone does not give the marker source access. See `docs/ASSESSMENT.md` before submitting. The course certificate and signed declaration belong in the assessment portal, not the application repository.

## Authorship

The initial implementation, tests and documentation were generated with substantial OpenAI Codex assistance. This repository does not claim they were written unaided. See `docs/ASSISTANCE.md`. The learner must review and understand the project and ensure the final declaration accurately reflects their contribution and the scheme's rules.
