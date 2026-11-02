# JCS Module 1b assessment preparation

Riverwatch implements the technical requirements in the supplied assignment brief. This checklist records the evidence to prepare; it is not a pass decision or a completed submission.

## Mapping to the supplied marking scheme

| Criterion | Implementation or evidence | Status |
| --- | --- | --- |
| App is unclassified | Public Environment Agency data only; no service number, unit information or restricted records in the app | Implemented |
| App is responsive | Two-column desktop layout, adapting tablet layout and stacked mobile layout | Implemented; see verification record |
| Connects to a Government API | Direct HTTPS fetches to `environment.data.gov.uk/flood-monitoring` | Implemented |
| User interacts through additional calls | River/station search; station details; measurement/time-window requests; warning-radius requests | Implemented |
| Code managed through Git or a web-based tool | Source and lockfile in [the private GitHub repository](https://github.com/Gazzybear/riverwatch-jcs-module-1b), with dependencies excluded | Give the marker access before submission |
| Reasonably easy to use | Labelled controls, automatic first selection, loading/empty/error messages, retry buttons, chart and table | Implemented |
| No obvious plagiarism | Original project produced with substantial AI assistance; Government data and third-party dependencies identified | Learner must review authorship and confirm permitted assistance |
| Course certificate/payment receipt enclosed | Attach relevant course evidence separately in the assessment portal | User action required |
| Open-source framework | React, with Vite as the build tool | Implemented |
| No major coding errors | Automated checks, production build and browser verification recorded separately | See verification record |
| No additional dedicated database | Browser fetches public API data directly; no persistence service | Implemented |

## Before creating the assessment idea

- [ ] Review `LEARNING-GUIDE.md`, run the app and understand the network requests and React state changes.
- [ ] Make and test any personal changes needed for this to be an honest reflection of your ability.
- [ ] Check the scheme's current position on AI-assisted code. The supplied declaration requires your own work and an honest reflection of your ability; the supplied documents do not explicitly set out an AI policy. Keep the assistance record accurate.
- [ ] Ensure the marker can access the GitHub source and build it using `npm ci` then `npm run build`.
- [ ] Include screenshots demonstrating different inputs, for example two stations, two periods and a mobile layout. The upload guide recommends screenshots; a video is optional.
- [ ] Attach the course completion certificate or, for a course without a certificate, completion screenshots. Eligibility and payment are for the scheme to determine.
- [ ] Complete and personally sign the supplied declaration only when its statements are accurate. Keep service number, unit, signature and certificate out of the source repository.
- [ ] Create the idea when ready, using the brief's format `00000000-XX_Mod1_ChalB`, replacing the placeholders with your actual details in the assessment portal.
- [ ] Add the description, source link and evidence, then review the portal submission before sending it.

## Neutral project description to adapt

Riverwatch is a responsive React application that lets users explore Environment Agency river-level data and nearby flood alerts. Users can search for monitoring stations, select a measurement, change the time period and inspect the resulting chart or data table. Each relevant selection makes a new Government API request. Readings can be exported as CSV. The application requires no API key or additional database and includes loading, empty and error states.

Accompany this description with an accurate account of your contribution and AI assistance. Do not describe the code as unaided work.

## Administrative status

No assessment idea has been created, no declaration has been signed, and no course evidence has been uploaded by this project build. No pass or payment has been confirmed. The supplied scheme information is dated 13 October 2021; current administrative terms should be checked in the assessment portal.
