\# DESIGN.md



\## Project: YouTube Kid-Filter — MVP Design



\*\*Purpose:\*\* Technical design for the MVP Chrome extension that hides/de-emphasizes YouTube videos judged to be non-educational using `gemini-2.5-flash-lite` via a secure backend proxy.



---



\# 1. High-level architecture



```

\[YouTube Page (Content Script)]  <--messages-->  \[Extension Service Worker / Background]

&nbsp;     |                                                       |

&nbsp;     | (POST classify request)                                |

&nbsp;     v                                                       v

&nbsp;              \[Backend Proxy (HTTPS)]  --(calls)-->  \[Gemini 2.5 Flash-Lite]

```



Components:



\* \*\*Content script\*\* — runs on `https://www.youtube.com/\*`. Scrapes visible video metadata, runs local heuristics, applies DOM changes (hide/blur), and communicates with the service worker when remote classification is needed.

\* \*\*Service worker (background)\*\* — handles requests from content scripts; maintains local cache (chrome.storage.local), batching logic, rate-limiting, retries, and forwards requests to the backend.

\* \*\*Backend proxy\*\* — secure server (e.g., Node/Express or serverless) that receives extension requests, validates them, calls Gemini model (server-side API key), parses \& returns JSON.

\* \*\*Options \& Popup UI\*\* — extension pages for settings, whitelist/blacklist, PIN, audit log.



Rationale:



\* Keeps API key off client (security).

\* Local heuristics reduce latency \& API calls.

\* Caching reduces cost and latency.



---



\# 2. Data \& storage models



All extension data stored in `chrome.storage.local`. Schema (JSON):



```json

{

&nbsp; "settings": {

&nbsp;   "enabled": true,

&nbsp;   "strictness": "medium",    // "lenient" | "medium" | "strict"

&nbsp;   "action": "hide",          // "hide" | "blur" | "collapse"

&nbsp;   "revealRequiresPIN": true,

&nbsp;   "pinHashSalt": "<salted\_hash>"

&nbsp; },

&nbsp; "whitelist": {

&nbsp;   "channels": \["UCxxxxx","Some Channel Name"],

&nbsp;   "videos": \["dQw4w9WgXcQ"]

&nbsp; },

&nbsp; "blacklist": {

&nbsp;   "channels": \[],

&nbsp;   "videos": \[]

&nbsp; },

&nbsp; "cache": {

&nbsp;   "<videoId>": {

&nbsp;     "label": "non-educational",

&nbsp;     "confidence": 0.92,

&nbsp;     "reason": "clickbait title",

&nbsp;     "ts": 1720000000000

&nbsp;   }

&nbsp; },

&nbsp; "audit": \[

&nbsp;   { "videoId":"abc", "title":"...", "label":"non-educational", "confidence":0.92, "action":"hidden", "ts": 1720000000000 }

&nbsp; ],

&nbsp; "telemetryOptIn": false

}

```



Cache TTL: default \*\*24 hours\*\* (configurable in settings).



Notes:



\* Use videoId (YouTube v=... id) as canonical key.

\* Store only minimal audit entries (cap = 50 or 100) to avoid bloat.



---



\# 3. Message \& API contracts



\## 3.1 Content script → Service worker



Message shape:



```ts

type ClassifyRequest = {

&nbsp; type: "CLASSIFY\_VIDEO";

&nbsp; videoId: string;

&nbsp; metadata: {

&nbsp;   title: string;

&nbsp;   description?: string;

&nbsp;   channelName?: string;

&nbsp;   channelId?: string;

&nbsp;   durationSec?: number;

&nbsp;   transcriptSnippet?: string; // truncated

&nbsp; }

};

```



Response:



```ts

type ClassifyResponse = {

&nbsp; ok: boolean;

&nbsp; source: "heuristic" | "cache" | "remote" | "error";

&nbsp; label?: "educational" | "non-educational" | "uncertain";

&nbsp; confidence?: number; // 0..1

&nbsp; reason?: string;

};

```



\## 3.2 Service worker → Backend Proxy (HTTP)



`POST /v1/classify`



Request JSON:



```json

{

&nbsp; "installationId": "random-uuid-generated-on-install",

&nbsp; "videoId": "dQw4w9WgXcQ",

&nbsp; "title": "...",

&nbsp; "description": "...",

&nbsp; "channelName": "..",

&nbsp; "channelId": "..",

&nbsp; "transcriptSnippet": "..."

}

```



Headers:



\* `Content-Type: application/json`

\* `Origin` will be `chrome-extension://<EXT\_ID>` (backend should check and whitelist extension ID)

\* Optionally X-Installation-Token if using a registration step



Response JSON (200):



```json

{

&nbsp; "label": "non-educational",

&nbsp; "confidence": 0.93,

&nbsp; "reason": "clickbait title and channel context"

}

```



Error responses use standard HTTP codes (429 for rate limit, 401 for unauthorized, 500 for backend error).



---



\# 4. Classification flow \& logic (detailed)



1\. \*\*DOM observation\*\*:



&nbsp;  \* Content script uses a `MutationObserver` (debounced) to detect new video cards on page appended to the feed / results / sidebar.

&nbsp;  \* Selectors scanned:



&nbsp;    \* `ytd-rich-item-renderer`, `ytd-video-renderer`, `ytd-grid-video-renderer`, `ytd-compact-video-renderer`, `ytd-shelf-renderer`, watch page recommendation cards `ytd-compact-video-renderer#dismissible`.

&nbsp;  \* Each processed element gets attribute `data-kidfilter-processed="1"`.



2\. \*\*Metadata extraction\*\*:



&nbsp;  \* For each card, extract:



&nbsp;    \* `videoId` from `href` (`/watch?v=...`) or `data-video-id` attributes.

&nbsp;    \* `title` innerText from `a#video-title` or `h3 a`

&nbsp;    \* `description` snippet if available

&nbsp;    \* `channelName` from `ytd-channel-name` or channel link

&nbsp;    \* `durationSec` from `span.ytd-thumbnail-overlay-time-status-renderer` (parse `mm:ss` or `hh:mm:ss`)

&nbsp;    \* `transcriptSnippet`: only on watch page where captions are in DOM — extract up to first 400 characters.



3\. \*\*Local whitelist/blacklist check\*\*:



&nbsp;  \* If the `videoId` or channel is in whitelist → label `educational`, source `heuristic` → show.

&nbsp;  \* If in blacklist → label `non-educational`, source `heuristic` → hide/blur.



4\. \*\*Local heuristics\*\* (fast \& deterministic):



&nbsp;  \* Keyword matching on title/description (positive and negative lists).

&nbsp;  \* Duration thresholds: extremely short (<30s) with clickbait tokens → non-educational.

&nbsp;  \* Channel reputation heuristics: known educational channels (if parent added or a built-in seed list) → educational.

&nbsp;  \* Heuristics return either decisive (skip remote call) or undecided.



5\. \*\*Cache lookup\*\*:



&nbsp;  \* If cached result exists and `now - ts < TTL` → return cached classification.



6\. \*\*Remote classification\*\*:



&nbsp;  \* If undecided/un-cached → send classify request to service worker → service worker enqueues request for backend.

&nbsp;  \* Use batching: collect up to N requests (N=5 default) or flush after timeout (e.g., 300ms) into single proxied call OR send singly (batching optional for MVP).

&nbsp;  \* Receive response, store in cache, send back to content script.



7\. \*\*Applying UI changes\*\*:



&nbsp;  \* If label=`non-educational` \& confidence >= threshold (determined by strictness) → apply configured action:



&nbsp;    \* `hide`: replace thumbnail \& title with placeholder node (keeps layout).

&nbsp;    \* `blur`: apply CSS blur filter to thumbnail \& optionally title.

&nbsp;    \* `collapse`: set element `display: none` or reduce height (less preferred because of sudden layout shifts).

&nbsp;  \* If label=`uncertain` or confidence below threshold → show "questionable" badge or leave visible.



8\. \*\*User interactions\*\*:



&nbsp;  \* Placeholder contains a `Reveal` button; clicking triggers:



&nbsp;    \* If `revealRequiresPIN` true → show popup for PIN (options page stored salted hash).

&nbsp;    \* Otherwise reveal temporarily (and optionally offer to whitelist).



9\. \*\*Audit logging\*\*:



&nbsp;  \* Append minimal audit event to `audit` array in storage (capped) with ts, videoId, label, confidence, action.



---



\# 5. Prompt design \& model interaction



\## 5.1 Prompt template (concise, deterministic)



Send to Gemini `gemini-2.5-flash-lite` with temperature `0` and small max tokens (e.g., 64).



```

Classify the following YouTube video as "educational", "non-educational", or "uncertain" based ONLY on these fields:

{"title":"...", "description":"...", "channel":"...", "transcript\_snippet":"..."}

Rules:

\- "educational": teaches facts/skills/concepts; tutorials, lectures, explainer content.

\- "non-educational": entertainment-only (pranks, mukbang, reaction, gameplay with no instruction), clickbait, sensationalist, ASMR, challenges.

Return JSON only: {"label":"educational"|"non-educational"|"uncertain","confidence":0.00-1.00,"reason":"short justification, <=20 words"}

```



\## 5.2 Model call parameters



\* Model: `gemini-2.5-flash-lite`

\* temperature: `0`

\* max\_output\_tokens: `64`

\* prefer\_json: yes (post-parse strictly)



\## 5.3 Post-processing rules



\* Strict JSON parse; if parse fails or fields missing → treat result as `{ label: "uncertain", confidence: 0.0 }`.

\* Clamp confidence to `\[0.0,1.0]`.

\* If label not recognized → treat as `uncertain`.

\* Optionally normalize confidence returned as percentage decimals to 0..1.



---



\# 6. Strictness mapping (exact thresholds)



\* \*\*Lenient\*\*: hide if `label == "non-educational"` AND `confidence >= 0.90`

\* \*\*Medium\*\*: hide if `confidence >= 0.75`

\* \*\*Strict\*\*: hide if `confidence >= 0.60`



If `label == "uncertain"`:



\* Default action: `do not hide` (unless parent toggles "aggressive uncertain handling" to blur).



---



\# 7. DOM strategy \& selectors (robustness)



Primary selectors to scan for video cards:



\* `ytd-rich-item-renderer`

\* `ytd-video-renderer`

\* `ytd-grid-video-renderer`

\* `ytd-compact-video-renderer`

\* Watch page recs: `ytd-compact-video-renderer#dismissible`



For title:



\* `a#video-title`, `a.yt-simple-endpoint.style-scope.ytd-video-renderer`



For channel:



\* `ytd-channel-name a`, `.ytd-channel-name`



For duration:



\* `span.ytd-thumbnail-overlay-time-status-renderer`



Robustness tips:



\* Use `element.querySelectorAll` with fallback chains.

\* Use `tryParseVideoId(href)` to handle shortened links or `/?v=` patterns.

\* Apply CSS-injection for placeholder styling using a unique class prefix to avoid collisions (e.g., `.kf-placeholder { ... }`).



MutationObserver usage:



\* Observe the document body with `{ childList: true, subtree: true }`.

\* Debounce processing of newly discovered nodes with 200–400ms delay.

\* Mark nodes as processed with `data-kidfilter-processed`.



Avoid heavy DOM operations — do minimal reads and writes; batch DOM writes using `requestAnimationFrame` when applying many changes.



---



\# 8. Caching \& batching strategy



\*\*Local cache\*\*:



\* Key: `videoId`

\* Value: classification object + `ts` timestamp.

\* TTL: default 24 hours.

\* Cache eviction: LRU or simple size cap (e.g., 2000 entries) — older entries removed.



\*\*Batching\*\*:



\* Option 1 (simple MVP): no batching; send single classification request per video.

\* Option 2 (recommended to save tokens): batch up to 5 videos into one request to backend with an array payload. Backend formats a single prompt containing multiple JSON items and requests JSON array in response.

\* Flushing rules: flush when batch size reached or after `300ms` timeout.



\*\*Rate-limiting\*\*:



\* Enforce per-installation rate limits on service worker (e.g., 1 req/sec, 500 req/day default). Backend has separate quota and rate-limits.



---



\# 9. Failure \& fallback behaviors



\* \*\*Backend unreachable or 5xx\*\*:



&nbsp; \* Use heuristics result if decisive.

&nbsp; \* Otherwise do nothing (show content) and set a flag `lastBackendFailTs` to avoid retrying too aggressively.

&nbsp; \* Notify parent via popup briefly: "Filter degraded — offline".



\* \*\*Model returns malformed JSON\*\*:



&nbsp; \* Treat as `uncertain`.

&nbsp; \* Log event to audit.



\* \*\*Excessive errors\*\*:



&nbsp; \* Backoff exponentially: 1s → 2s → 4s up to 1 minute.



\* \*\*YouTube DOM change / missing selectors\*\*:



&nbsp; \* Content script logs exception to local console and toggles minimal graceful behavior (no hiding).



---



\# 10. Security \& privacy (practical implementation)



\*\*Backend secret management\*\*



\* Store Gemini API key in server environment (e.g., env var).

\* Backend should whitelist the extension's `chrome-extension://<EXT\_ID>` origin (check `Origin` header) and require a registration token if feasible.



\*\*Communication\*\*



\* Always HTTPS, TLS 1.2+.

\* Use short-lived tokens if implementing an auth flow later.



\*\*Minimize data sent\*\*



\* Only send textual metadata and `videoId`.

\* Truncate `description` and `transcriptSnippet` to 4000 characters combined (or even less to save tokens).

\* Do not send cookies, browser history, or user PII.



\*\*Storage \& deletion\*\*



\* Allow parent to clear local storage (Options page).

\* If telemetry enabled, anonymize and aggregate before sending to backend.



\*\*PIN handling\*\*



\* Never store raw PIN; store salted hash in `chrome.storage.local`.

\* Use PBKDF2/Argon2 style hash (if implementing client-side libs) or simple salted SHA-256 for MVP (document limits).



\*\*Content Security Policy\*\*



\* Use `manifest.json` minimal host permissions: `https://www.youtube.com/\*` and the backend domain.



---



\# 11. UI / UX design notes (brief)



\*\*Popup UI\*\*



\* Toggle ON/OFF

\* Strictness control (three radio buttons)

\* Quick "Whitelist current" / "Blacklist current" buttons

\* Count of hidden videos on page (computed from content script)



\*\*Options page\*\*



\* Whitelist / Blacklist management (add channel by ID or name; add video by URL)

\* Audit log (most recent 50 events)

\* Change PIN, toggle reveal behavior

\* Telemetry opt-in toggle

\* "Clear local data" button



\*\*Placeholder card\*\*



\* Message: `Hidden by parent filter`

\* Buttons: `\[Reveal] \[Why?] \[Whitelist channel]`

\* "Why?" opens short reason (classifier reason and confidence).



Accessibility:



\* Ensure placeholders and buttons reachable via keyboard.

\* Provide aria-label attributes.



---



\# 12. Testing \& QA plan (concrete)



\*\*Unit tests\*\*



\* Heuristic functions (positive \& negative lists)

\* VideoId extraction

\* Storage read/write \& TTL behavior

\* Message passing mocks between content \& service worker



\*\*Integration tests\*\*



\* Puppeteer-based runs that load representative YouTube pages and assert DOM changes:



&nbsp; \* Home feed

&nbsp; \* Search results

&nbsp; \* Channel page

&nbsp; \* Watch page (recommendations)

\* Simulate backend responses (mock server) to confirm behavior for all labels \& confidences.



\*\*Manual test vectors\*\*



\* Create a curated list of ~200 YouTube links:



&nbsp; \* 100 clearly educational (lectures, tutorials)

&nbsp; \* 100 clearly non-educational (pranks, mukbang, clickbait)

\* Test under three strictness settings and measure:



&nbsp; \* False positives (educational hidden) rate — aim < 5% for MVP

&nbsp; \* False negatives (non-educational shown) — aim < 20% for MVP



\*\*Edge-case tests\*\*



\* Missing videoId extraction

\* Short titles only

\* Long descriptions

\* Page reloads \& infinite scroll scenario



---



\# 13. Observability \& monitoring (backend)



\* Basic server logs:



&nbsp; \* Requests count, 4xx/5xx error rates

&nbsp; \* Average latency to Gemini

&nbsp; \* Token usage (if available)

\* Alerts:



&nbsp; \* High error rate (>5% 5xx)

&nbsp; \* Sudden increase in requests (abuse)

\* Privacy: Only aggregate statistics by default; do not log raw title/description unless telemetry opted-in.



---



\# 14. Deployment \& release checklist



\*\*Backend\*\*



\* Deploy on HTTPS-capable host (Heroku, Vercel serverless, AWS Lambda + API Gateway, or DigitalOcean).

\* Set env var `GEMINI\_API\_KEY`.

\* Whitelist extension origin(s) and add basic rate-limiting.



\*\*Extension\*\*



\* Manifest V3, minimal permissions.

\* Build step to bundle html/css/js and sign in Chrome Web Store.

\* Include privacy policy text in store listing.



\*\*Pre-release\*\*



\* Full test vector run.

\* Manual QA for reveal, PIN, options page.

\* Document how to roll back backend and update extension.



---



\# 15. Implementation checklist (engineering tasks)



1\. Project scaffolding



&nbsp;  \* Extension repo: `src/` with `content-script.js`, `service-worker.js`, `popup/`, `options/`.

&nbsp;  \* Backend repo: `server/` with `POST /v1/classify` endpoint.



2\. Core client features (MVP)



&nbsp;  \* MutationObserver + selectors + metadata extraction

&nbsp;  \* Heuristics library

&nbsp;  \* Whitelist/blacklist persistence \& UI

&nbsp;  \* Service worker messaging \& caching

&nbsp;  \* DOM placeholder UI for hide/blur



3\. Backend features (MVP)



&nbsp;  \* Validate origin

&nbsp;  \* Prompt builder for Gemini

&nbsp;  \* JSON parse \& validation

&nbsp;  \* Rate limiting

&nbsp;  \* Basic logging



4\. Testing \& CI



&nbsp;  \* Unit tests for heuristics

&nbsp;  \* Integration tests with mock backend

&nbsp;  \* E2E tests with headless browser



5\. Documentation



&nbsp;  \* README setup instructions

&nbsp;  \* Privacy policy text

&nbsp;  \* Developer doc for extending heuristics and updating selectors



---



\# 16. Example pseudocode snippets



\## Content script: detect + request classify (pseudo)



```js

const observer = new MutationObserver(debouncedProcess);

observer.observe(document.body, { childList: true, subtree: true });



function processNode(node) {

&nbsp; if (node.dataset?.kidfilterProcessed) return;

&nbsp; const videoId = extractVideoId(node);

&nbsp; if (!videoId) return;

&nbsp; node.dataset.kidfilterProcessed = "1";

&nbsp; const metadata = scrapeMetadata(node);

&nbsp; // Check local storage whitelist/blacklist + heuristics (sync)

&nbsp; const heuristic = runHeuristics(metadata);

&nbsp; if (heuristic.decision) applyAction(node, heuristic);

&nbsp; else {

&nbsp;   chrome.runtime.sendMessage({ type: 'CLASSIFY\_VIDEO', videoId, metadata }, (resp) => {

&nbsp;     if (resp.ok) applyAction(node, resp);

&nbsp;   });

&nbsp; }

}

```



\## Service worker: handle classify message (pseudo)



```js

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {

&nbsp; if (msg.type !== 'CLASSIFY\_VIDEO') return;

&nbsp; const cached = await cacheLookup(msg.videoId);

&nbsp; if (cached) { sendResponse({ ok: true, ...cached, source: 'cache' }); return; }

&nbsp; // enqueue request for batching or call backend

&nbsp; const result = await callBackendClassify(msg);

&nbsp; if (result) { await saveCache(msg.videoId, result); sendResponse({ ok: true, ...result, source: 'remote' }); }

&nbsp; else sendResponse({ ok: false, source: 'error' });

&nbsp; return true; // async

});

```



---



\# 17. Future improvements (short)



\* On-device light classifier (to remove backend entirely).

\* Use YouTube Data API (with explicit OAuth) to enrich metadata (requires review \& quota).

\* Feedback loop where parent corrections are used to improve heuristics or to fine-tune a classifier.

\* Multi-profile and schedules.



---



\# 18. Risks and mitigations (summary)



\* \*\*Model mistakes → hide educational content\*\*: mitigate with conservative default thresholds, easy reveal + whitelist.

\* \*\*YouTube DOM changes\*\*: mitigate with robust selectors, detection tests, and published update process.

\* \*\*Exposed API key\*\*: prevent by keeping key on server.

\* \*\*Abuse of backend\*\*: enforce rate-limiting and Origin validation.



---



\# 19. Final notes \& next steps



\* I prioritized safety, conservative default behavior, and minimal permissions.

\* Next concrete deliverables I can produce on request:



&nbsp; \* `manifest.json` (MV3) + skeleton files

&nbsp; \* Skeleton `service-worker.js` + `content-script.js`

&nbsp; \* Minimal Express backend `server.js` showing the classify endpoint \& Gemini call

&nbsp; \* Test vector JSON file for QA



