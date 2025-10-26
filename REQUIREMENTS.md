\# REQUIREMENTS.md



\## Project: YouTube Kid-Filter (MVP)



\*\*Goal:\*\* a Chrome extension for a parent to hide or de-emphasize YouTube videos that are non-educational and offer little value, using `gemini-2.5-flash-lite` for content classification.



---



\## 1. Overview \& Constraints



\*\*MVP scope\*\*



\* Classify YouTube videos shown in the browser (title, description, available transcript/subtitles when possible, and channel name) as \*\*educational\*\* or \*\*non-educational/low-value\*\*.

\* Replace/hide non-educational video thumbnails and titles on YouTube pages (search results, recommended feeds, channel pages, watch pages).

\* Provide parent controls: strictness slider (lenient/medium/strict), whitelist/blacklist (channel or video URL), and a manual override.

\* Minimal backend: a small secure proxy that forwards text to `gemini-2.5-flash-lite` (recommended; see security section). The extension must not embed the Gemini API key.

\* Focus on text-based classification only (no audio/video frame analysis) for MVP.



\*\*Out of scope for MVP\*\*



\* Deep video semantic analysis from raw audio/video.

\* Automatic transcript generation (unless YouTube captions exist on the page).

\* Multiple sibling-profiles, scheduling, or analytics dashboards beyond simple telemetry opt-in.

\* iOS/Firefox support (Chrome only).



---



\## 2. User Stories



1\. \*\*Parent - Install \& enable filter\*\*



&nbsp;  \* As a parent, I can install the extension and enable filtering on YouTube.

2\. \*\*Parent - Adjust strictness\*\*



&nbsp;  \* As a parent, I can set a strictness level: Lenient/Medium/Strict that adjusts classification thresholds.

3\. \*\*Parent - Whitelist/Blacklist\*\*



&nbsp;  \* As a parent, I can whitelist channels or video URLs to always show, and blacklist to always hide.

4\. \*\*Parent - Visual response\*\*



&nbsp;  \* As a parent, I can choose hide (remove thumbnail), blur, or collapse a card for non-educational videos.

5\. \*\*Child - Transparent browsing\*\*



&nbsp;  \* As a child, when a video is hidden, it’s replaced with a placeholder message (configurable by parent).

6\. \*\*Parent - Manual override\*\*



&nbsp;  \* As a parent, I can reveal a hidden video temporarily and optionally mark it as allowed for future.

7\. \*\*Parent - Audit log\*\*



&nbsp;  \* As a parent, I can view recent filtering actions (local list showing date, video title, label).

8\. \*\*Parent - Key security\*\*



&nbsp;  \* As a developer/owner, we must not embed Gemini API keys in the client.



---



\## 3. Acceptance Criteria (MVP)



\* Extension hides/collapses/blur non-educational videos in >90% of tested scenarios on desktop YouTube pages (search results, home feed, recommended sidebar) in typical modern Chrome versions.

\* Classifier uses Gemini to return a JSON label + confidence; extension applies action when confidence >= threshold (set by strictness).

\* Whitelist and blacklist operate correctly and persist in `chrome.storage`.

\* No API key embedded in extension; backend proxy defined and used.

\* Parent UI (popup/options page) allows setting strictness, managing lists, and viewing audit log.

\* Minimal logging only stored locally; telemetry must be opt-in.



---



\## 4. Functional Requirements



\### 4.1 UI Components



\* \*\*Extension popup\*\*



&nbsp; \* Toggle filter On/Off

&nbsp; \* Strictness slider (Lenient / Medium / Strict)

&nbsp; \* Quick Whitelist/Blacklist button for currently open video page

&nbsp; \* Count of hidden videos on active page

&nbsp; \* Link to Options page

\* \*\*Options page\*\*



&nbsp; \* Manage whitelist (channels/video URLs)

&nbsp; \* Manage blacklist (channels/video URLs)

&nbsp; \* Audit log (last 50 automated actions)

&nbsp; \* Privacy \& telemetry toggle (opt-in)

&nbsp; \* “Bypass code” (parent-set PIN to reveal hidden content)

\* \*\*Placeholder UI (on YouTube pages)\*\*



&nbsp; \* Small card saying “Hidden by parent filter — \[Reveal]”

&nbsp; \* Hover/expand to show reason (optional short rationale from classifier)

&nbsp; \* \[Reveal temporarily] (requires parent PIN if configured)

\* \*\*Admin (developer) backend dashboard (optional)\*\*



&nbsp; \* Monitor API usage \& errors (private)



\### 4.2 Core Behavior



\* \*\*Content sources used for classification\*\*



&nbsp; 1. Video title

&nbsp; 2. Video description

&nbsp; 3. Channel name

&nbsp; 4. Transcript/captions if available in DOM (prefer) — fallback: do not attempt transcript scraping if not present

&nbsp; 5. Tags or badges visible (e.g., #educational) if available in DOM

\* \*\*Classification flow\*\*



&nbsp; 1. Content script detects a visible video element on the page.

&nbsp; 2. Gather metadata (title, description snippet, channel, transcript if accessible).

&nbsp; 3. Check whitelist/blacklist locally; if match, obey list.

&nbsp; 4. Apply fast heuristic checks client-side (whitelist words, channel allowlist, duration thresholds) — if heuristic decisively indicates educational, skip remote call.

&nbsp; 5. If heuristics inconclusive, call background script to request classification (via backend proxy to Gemini).

&nbsp; 6. Receive classification JSON: `{ label: "educational"|"non-educational"|"uncertain", confidence: 0.0-1.0, reason: "..." }`

&nbsp; 7. If confidence >= threshold (per strictness), take action (hide/blur/collapse); otherwise take no action or mark uncertain.

&nbsp; 8. Save audit event locally.



\### 4.3 Heuristics (fast, local)



\* If channel is in whitelist => educational

\* If channel is in blacklist => non-educational

\* If title/description has educational keywords (e.g., "lecture", "tutorial", "lesson", "how to", "study", "math", "science", "history", "lesson", "explain", "course", "classroom", etc.) and duration > 2 minutes => favor educational

\* If title contains many clickbait tokens (e.g., "shocking", "life hacks", "100x", "gone wrong", "prank", "reaction", "mukbang", "challenge", "fidget", "ASMR" — configurable list), flag as likely non-educational

\* Heuristics produce a vote + confidence; only decisive heuristics bypass remote classification.



\### 4.4 Gemini Integration



\* \*\*Where to run API calls:\*\* via a small, secure backend proxy (recommended). Do NOT hardcode the API key into the extension.

\* \*\*Request content:\*\* supply only textual metadata: title, short description (truncate to N tokens/characters), channel name, and transcript snippet (if available) — do \*\*not\*\* upload video files.

\* \*\*Prompting:\*\* send an explicit classification prompt (see section \*Prompt Template\*).

\* \*\*Expected response:\*\* JSON with `label`, `confidence` (float 0–1), and a short `reason`. Ask Gemini to return compact JSON only to minimize token usage.

\* \*\*Rate limiting \& batching:\*\* group multiple classification requests where possible; cache results by video ID for a configurable TTL (e.g., 24 hours).

\* \*\*Token limits:\*\* keep prompt concise; set max output tokens to small number (e.g., 64).



---



\## 5. Non-Functional Requirements



\* \*\*Privacy\*\*



&nbsp; \* Default behavior: do not collect any personal data.

&nbsp; \* Transmitted to backend only: video text metadata and transcript snippets; no browser cookies, no video files, no identifiers except video ID for caching.

&nbsp; \* Store whitelist/blacklist and audit locally in `chrome.storage.local` by default.

&nbsp; \* Telemetry strictly opt-in and minimal (counts only).

\* \*\*Security\*\*



&nbsp; \* API keys strictly stored on backend; use HTTPS with TLS 1.2+.

&nbsp; \* Content script must not expose the API key.

&nbsp; \* Use Content Security Policy and minimize permissions in `manifest.json`.

\* \*\*Performance\*\*



&nbsp; \* Minimal UI lag. Local heuristics should handle most items; remote calls should be asynchronous and non-blocking.

&nbsp; \* Avoid blocking page rendering; show placeholders only after classification or heuristics.

\* \*\*Reliability\*\*



&nbsp; \* Graceful failure: if backend unreachable, extension should fallback to heuristics or default-to-show to avoid over-blocking.

\* \*\*Compatibility\*\*



&nbsp; \* Chrome stable on desktop; support Manifest V3 service-worker based background worker.

\* \*\*Maintainability\*\*



&nbsp; \* Keep modular: content scripts (DOM scraping + heuristics), background/service worker (CRM, API proxy interface, caching), options page, popup UI, backend (proxy + rate-limiter).



---



\## 6. Architecture \& Data Flow



1\. \*\*Content Script (runs on YouTube)\*\*



&nbsp;  \* Detects video card elements.

&nbsp;  \* Extracts title, description, channel, video id, duration, and (if present) captions/transcript snippet.

&nbsp;  \* Checks local whitelist/blacklist and heuristics.

&nbsp;  \* If decision requires, sends message to background: `classify(videoId, metadata)`.

2\. \*\*Extension Background / Service Worker\*\*



&nbsp;  \* Receives classify request.

&nbsp;  \* Checks local cache (`chrome.storage.local`) for videoId result.

&nbsp;  \* If not cached, forwards request to backend proxy API endpoint (server-side).

&nbsp;  \* Stores result in cache, forwards result to content script.

3\. \*\*Backend Proxy\*\*



&nbsp;  \* Validates request (origin check, rate-limiting per extension instance or API key).

&nbsp;  \* Formats prompt, calls `gemini-2.5-flash-lite` API with API key (server-side).

&nbsp;  \* Parses the model response and returns structured JSON to extension.

&nbsp;  \* Optionally logs anonymized stats if user opted in.

4\. \*\*Content Script\*\*



&nbsp;  \* Receives result and applies the configured action (hide/blur/collapse) on the DOM.

&nbsp;  \* Logs action to local audit.



\*\*Storage\*\*



\* `chrome.storage.local` schema:



```json

{

&nbsp; "settings": {

&nbsp;   "enabled": true,

&nbsp;   "strictness": "medium",

&nbsp;   "blurOrHide": "hide",

&nbsp;   "parentPINHash": "<hash>"

&nbsp; },

&nbsp; "whitelist": {

&nbsp;   "channels": \["Channel A", "channelId:UCxxx"],

&nbsp;   "videos": \["https://youtube.com/watch?v=xxx"]

&nbsp; },

&nbsp; "blacklist": { ... },

&nbsp; "cache": {

&nbsp;   "<videoId>": {

&nbsp;     "label": "non-educational",

&nbsp;     "confidence": 0.92,

&nbsp;     "reason": "...",

&nbsp;     "ts": 169xxx

&nbsp;   }

&nbsp; },

&nbsp; "audit": \[

&nbsp;   { "videoId": "...", "title": "...", "action": "hidden", "ts": 169... }

&nbsp; ]

}

```



---



\## 7. Prompt Template (for gemini-2.5-flash-lite)



\*\*Design principles\*\*



\* Keep prompt short to reduce tokens and latency.

\* Ask for structured JSON output only.

\* Provide explicit definitions and examples of what “educational” means.



\*\*Example prompt (send as model input):\*\*



```

You are a classifier that determines if a YouTube video is educational and valuable for a child audience. 

Input fields (JSON): { "title": "...", "description": "...", "channel": "...", "transcript\_snippet": "..." }

Rules:

\- "educational": teaches facts, skills, concepts, or explains real-world or academic topics; includes tutorials and lectures.

\- "non-educational": entertainment, clickbait, reaction, prank, mukbang, gameplay with no learning value, ASMR, sensationalist or deceptive titles phrased to attract views without content.

Return JSON only: { "label": "educational"|"non-educational"|"uncertain", "confidence": 0.00-1.00, "reason": "short justification (max 20 words)" }

If uncertain, use label "uncertain".

Be concise. Base decision only on the provided text.

```



\*\*Model call parameters\*\*



\* Model: `gemini-2.5-flash-lite`

\* Max output tokens: small (e.g., 64)

\* Temperature: 0 (deterministic)

\* Top\_p: default

\* Stop sequences: none (rely on JSON parse).



\*\*Post-processing\*\*



\* Validate model returned valid JSON; if not, fallback to "uncertain".

\* Clamp confidence to \[0,1].



---



\## 8. Thresholds \& Strictness



\* \*\*Strictness levels:\*\*



&nbsp; \* \*\*Lenient\*\*: hide only if model label=`non-educational` and confidence >= 0.9

&nbsp; \* \*\*Medium\*\*: hide if label=`non-educational` and confidence >= 0.75

&nbsp; \* \*\*Strict\*\*: hide if label=`non-educational` and confidence >= 0.6

\* If label=`uncertain` or confidence below threshold:



&nbsp; \* Optionally blur or add a “questionable” badge instead of hiding, configurable by parent.



---



\## 9. Permissions \& Manifest (high-level)



\* Permissions required:



&nbsp; \* `activeTab` or `<all\_urls>` limited to `https://www.youtube.com/\*`

&nbsp; \* `storage` (chrome.storage)

&nbsp; \* `scripting` (inject content scripts)

&nbsp; \* `identity` only if using OAuth; not required for MVP

&nbsp; \* `alarms` (optional) for cache cleanup

\* Keep permissions minimal in manifest; request host permissions only for `https://www.youtube.com/\*`.



---



\## 10. Security \& Privacy Considerations



\* \*\*Do not store or transmit\*\*:



&nbsp; \* Personal browsing history

&nbsp; \* Cookies, user tokens, or PII

\* \*\*Backend practices\*\*



&nbsp; \* Use server-side API key storage, origin checks (only accept requests from signed extension IDs or with a short-lived token).

&nbsp; \* Rate-limit by IP or extension token to avoid abuse.

&nbsp; \* Log only anonymized counts if telemetry is enabled.

\* \*\*Least privilege\*\*: only request YouTube page permissions, not broader browsing history.



---



\## 11. Failure Modes \& Handling



\* \*\*Backend unreachable\*\*



&nbsp; \* Fall back to heuristics or default to "show" (prefer not to over-block).

&nbsp; \* Show unobtrusive banner in extension popup: “Filter temporarily degraded”.

\* \*\*Malformed model response\*\*



&nbsp; \* Treat as uncertain; do not hide; log event locally.

\* \*\*Transcript not available\*\*



&nbsp; \* Use title/description only.

\* \*\*Excessive CPU/DOM churn\*\*



&nbsp; \* Limit content script scans (throttle with MutationObserver and debouncing).

\* \*\*False positives\*\*



&nbsp; \* Provide easy reveal + whitelist option; maintain audit to allow parent review.



---



\## 12. Testing Plan



\* \*\*Unit tests\*\*



&nbsp; \* Heuristic functions

&nbsp; \* Storage utilities

&nbsp; \* Prompt builder and JSON parser

\* \*\*Integration tests\*\*



&nbsp; \* Content script correctly scrapes video metadata on:



&nbsp;   \* YouTube home feed

&nbsp;   \* Search results

&nbsp;   \* Channel pages

&nbsp;   \* Watch page (recommendations)

&nbsp; \* Background caching and messaging between content script and background.

&nbsp; \* Options page CRUD for whitelist/blacklist

\* \*\*End-to-end manual tests\*\*



&nbsp; \* Create a test list of known educational videos and known non-educational videos; verify expected behavior under each strictness.

&nbsp; \* Simulate backend failure and confirm fallbacks.

\* \*\*Acceptance tests\*\*



&nbsp; \* For a set of 200 test videos (mix of channels and content types), verify that behavior meets acceptance criteria.



---



\## 13. Deployment \& Ops



\* \*\*Extension publish\*\*



&nbsp; \* Pack Chrome extension, follow Chrome Web Store policies; include privacy policy.

\* \*\*Backend\*\*



&nbsp; \* Minimal node/express or serverless function that proxies to Gemini API, enforces rate limiting, and checks allowed origins or a shared secret.

\* \*\*Secrets\*\*



&nbsp; \* Gemini API key stored in server environment, not in extension.

\* \*\*Monitoring\*\*



&nbsp; \* Error alerts (Sentry) on backend and aggregated usage metrics (opt-in).



---



\## 14. Legal \& Policy



\* Must comply with:



&nbsp; \* Chrome Web Store policies (user data privacy).

&nbsp; \* YouTube/Google Terms of Service — do not scrape or redistribute copyrighted content; only read visible text and captions for classification.

&nbsp; \* GDPR / local privacy rules if the user base is in EU — provide mechanism to delete local data (clear storage).

\* Include clear privacy policy in extension listing indicating what is sent to the server and why.



---



\## 15. Future Roadmap (post-MVP)



\* On-device lightweight LLM/classifier (if feasible) to avoid backend calls.

\* Multi-profile support for different children.

\* Schedule-based filtering and time limits.

\* Teacher/education dataset fine-tuning for improved accuracy.

\* Feedback loop UI for parents to provide corrections to improve classifier.

\* Integrate YouTube Data API for more robust metadata (requires OAuth and API quota).



---



\## 16. Developer Notes \& Implementation Hints



\* Use Manifest V3 (service worker background).

\* Content script selection strategy:



&nbsp; \* Use `MutationObserver` to detect new video cards as the user scrolls.

&nbsp; \* For each card, attach a processed attribute to avoid reprocessing: `data-yfk-processed="1"`.

\* Cache key: use `videoId` (extracted from `href` or `data-\*` attributes).

\* Proxy endpoint example (server):



&nbsp; \* `POST /classify` with body `{ api\_version: "v1", videoId, title, description, channel, transcript\_snippet }`

&nbsp; \* Backend validates allowed extension ID or shared secret, then calls Gemini model.

\* Consider batching: collect up to N (e.g., 5-10) classification requests in one model call to reduce overhead — but only if prompt/batching tokens remain reasonable.

\* Testing transcripts:



&nbsp; \* YouTube captions may be in the DOM only on watch pages; for feed thumbnails transcripts are rarely present — rely on title/description mostly.



---



\## 17. Sample JSON outputs \& Actions



\*\*Model outputs\*\*



```json

{ "label":"non-educational", "confidence":0.93, "reason":"clickbait title + channel known for pranks" }

{ "label":"educational", "confidence":0.88, "reason":"tutorial-style title and detailed description" }

{ "label":"uncertain", "confidence":0.45, "reason":"short title, no transcript" }

```



\*\*Mapping to actions\*\*



\* `non-educational` \& confidence >= threshold => hide/collapse

\* `non-educational` \& confidence below threshold => blur / mark questionable

\* `educational` => show

\* `uncertain` => do not hide; show question badge (configurable)



---



\## 18. Example Acceptance Checklist (quick)



\* \[ ] Extension can be enabled/disabled in popup

\* \[ ] Content script detects video cards on homepage, search, watch page

\* \[ ] Heuristics classify obvious cases without remote calls

\* \[ ] Calls to backend proxy succeed and return JSON in expected format

\* \[ ] Cache saves classification for video IDs for 24 hours

\* \[ ] Whitelist/blacklist persist and override model decisions

\* \[ ] Parent PIN reveal works and is secure (store salted hash)

\* \[ ] Telemetry opt-in present and defaulted OFF

\* \[ ] Privacy policy page linked in extension listing



---



\## 19. Risks \& Mitigations



\* \*\*Risk:\*\* Embedding API key in extension -> compromise.



&nbsp; \* \*\*Mitigation:\*\* Use backend proxy; short-lived tokens optional.



\* \*\*Risk:\*\* False positives hide useful educational content.



&nbsp; \* \*\*Mitigation:\*\* Default to conservative thresholds; provide easy reveal and whitelist.



\* \*\*Risk:\*\* YouTube DOM changes break scraping.



&nbsp; \* \*\*Mitigation:\*\* Build resilient selectors and monitor; update heuristics frequently.



\* \*\*Risk:\*\* Model hallucination in `reason` field.



&nbsp; \* \*\*Mitigation:\*\* Validate JSON strictly; ignore or truncate reason length.



---



\## 20. Minimal Deliverables for MVP Release



1\. Chrome extension packaged (Manifest V3) with:



&nbsp;  \* popup UI (toggle + strictness)

&nbsp;  \* options page (whitelist/blacklist + audit + PIN)

&nbsp;  \* content scripts \& background service worker

&nbsp;  \* local caching and heuristics

2\. Small backend proxy service that accepts classification requests and proxies to `gemini-2.5-flash-lite` securely.

3\. Developer documentation including:



&nbsp;  \* How to deploy backend and set environment variables

&nbsp;  \* How to build \& load extension locally

&nbsp;  \* Privacy policy text to include in store listing

4\. Test plan \& sample test vector set (list of video links labeled educational vs non-educational) for acceptance validation.

