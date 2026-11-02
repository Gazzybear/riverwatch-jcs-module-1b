# Verification record

Checked on 2 November 2026 using Node.js 22.23.4 and npm 11.5.2 on Windows. Live Government data changes, so the numerical examples are observations from the test session, not fixed expected values.

## Automated and build checks

- `npm test`: 11 tests passed. Coverage includes query encoding, trusted resource URLs, empty versus zero readings, numeric validation, sorting/deduplication, window boundaries, daylight-saving transitions, measurement selection, station normalisation, coordinates, CSV and HTTP/network/schema errors.
- `npm run build`: Vite production build passed.
- Dependency installation completed successfully; npm reported no known vulnerabilities in its installation audit at that time. This is not a security audit of the application.

## Browser checks against the production build

- The default River Thames search returned 58 monitoring stations and automatically selected Abingdon Lock.
- Searching for Kingston returned one station and loaded its details and Stage measurement.
- Searching for `zzzz-no-such-station` returned zero stations, cleared the selection and displayed a useful empty state. Changing to River Severn with no station-name filter returned 22 stations and selected Ashleworth.
- Switching to seven days fetched and charted roughly 667 available readings; switching to six hours returned 23 readings during the test.
- Selecting Kingston's `mAOD` measurement returned no readings in the selected period. The old chart was cleared and the empty message was displayed.
- Changing the warning search radius from 10 km to 50 km produced a new result with the correct radius in its explanatory text.
- The readings table expanded successfully.
- Download CSV created `riverwatch-3400TH-6h.csv`. Parsing the downloaded file confirmed 23 records, the `timestamp_utc` and `level_mASD` columns, and timestamps from 14:30 to 20:00 UTC on 2 November 2026, matching the displayed six-hour data.
- Desktop layout was visually inspected at 1280 pixels wide; the app was also viewed at the browser's approximately 780-pixel default width.
- Mobile layout was visually inspected at 390 and 320 pixels wide. Chart labels were enlarged for narrow screens. At 320 pixels, the document content width matched its 305-pixel client width after accounting for the vertical scrollbar; no page-wide horizontal overflow remained.

## Evidence files

- `evidence/01-kingston-seven-days-desktop.jpg`: desktop station search, seven-day graph and nearby warnings panel.
- `evidence/02-abingdon-mobile.jpg`: another station and a 24-hour graph in the mobile layout.

These are real screenshots of the application using live API responses, not mockups.

## Limits of verification

The Environment Agency returned no active warnings during the checked searches, so an expanded live warning was not available to exercise. Error responses were tested at the request layer; a full browser offline/reconnect test was not performed. This was not an exhaustive accessibility audit or a test on every browser/device. Some measurements have no recent data, and the public service does not guarantee availability.

A temporary Vite hot-reload error appeared while source files were being reformatted during development. Final checks used the separately built production preview; the development server's hot-reload runtime is not included in the production files.

The screenshots and tests support a technical review. They do not establish compliance with the scheme's authorship rules, course eligibility, a pass decision or a completed assessment submission.
