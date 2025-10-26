# TASKS.md



Below is a detailed, prioritized checklist of tasks for the **YouTube Kid-Filter (MVP)**. Each section is organized as actionable checkboxes you can assign, track, and mark complete. I thought through dependencies and acceptance criteria so this can be used directly by engineers, QA, and product.



---



# 0. Legend & conventions



* ✅ = done; ⬜ = todo

* `MUST` / `SHOULD` indicate priority.

* Where helpful, I include short acceptance criteria (AC) under each major task.

* Owner column is optional — fill it with team members or leave blank.



---



# 1. Project setup (repo, CI, dependencies)



* [x] ✅ Create Git repositories: `extension/` and `backend/`. (owner: )

* [x] ✅ Add README.md with quick start for each repo.

* [x] ✅ Add `.gitignore`, `LICENSE`, and basic contributing guidelines.

* [x] ⬜ Configure CI (GitHub Actions or equivalent) to run:



&nbsp; * [x] linting for JS/TS

&nbsp; * [x] unit tests

&nbsp; * [x] build step for extension bundle

* [x] ⬜ Add issue/PR templates (bug, feature, chore).

* [x] ⬜ Create `env.example` for backend (no secrets).

* AC: Repos exist, CI runs on PRs, and README contains local dev start instructions.



---



# 2. Core extension scaffolding



## 2.1 Manifest & build



* [x] ⬜ Create `manifest.json` (Manifest V3) with minimal permissions:



&nbsp; * `host_permissions`: `https://www.youtube.com/*`

&nbsp; * `permissions`: `storage`, `scripting`, `alarms`

* [x] ⬜ Add build/bundle toolchain (esbuild/webpack/Vite) and npm scripts:



&nbsp; * `build`, `dev`, `lint`, `test`

* AC: `chrome://extensions` can load unpacked extension after build.



## 2.2 Directory & files



* [x] ⬜ `src/content-script/` — content script entry

* [x] ⬜ `src/service-worker/` — background/service worker

* [x] ⬜ `src/popup/` — popup HTML + JS

* [x] ⬜ `src/options/` — options UI

* [x] ⬜ `src/styles/` — shared CSS (scoped classes)

* AC: Files present, build produces `dist/` ready to load.



---



# 3. Content script: scraping, heuristics, DOM changes



## 3.1 DOM detection & extraction



* [x] ✅ Implement `MutationObserver` with debounce (200–400ms).

* [x] ✅ Implement robust selectors for cards (`ytd-rich-item-renderer`, `ytd-video-renderer`, etc).

* [x] ✅ Implement `extractVideoId(node)` util that handles `/watch?v=...` and shortened links.

* [x] ✅ Extract metadata: `title`, `descriptionSnippet`, `channelName`, `channelId` (if available), `durationSec`.

* AC: On sample YouTube pages, `extractVideoId` returns correct IDs for >95% of visible cards.



## 3.2 Heuristics library (client-side)







* [x] ✅ Implement positive keyword list (education-related).



* [x] ✅ Implement negative keyword list (clickbait / entertainment).



* [x] ✅ Implement duration heuristics (short vs long).



* [x] ✅ Implement whitelist/blacklist check (reads from `chrome.storage.local`).



* [x] ✅ Implement decision structure: `decisive` vs `undecided`.



* AC: Heuristics produce `decision` with reason and confidence-like score; unit tests for keywords/duration.



## 3.3 UI transformations



* [x] 🟩 Implement placeholder component (HTML/CSS) for `hide` action.

* [x] 🟩 Implement `blur` action using CSS classes (no global style collisions).

* [x] 🟩 Implement `collapse` option (prefer animation + minimal layout shift).

* [x] 🟩 Add reveal flow: `Reveal` button, optionally guarded by PIN flow via message to options page / service worker.

* AC: Placeholder appears and reveal flow works on click.



---



# 4. Background service worker (extension)



* [x] ✅ Implement message listener for `CLASSIFY_VIDEO`.

* [x] ✅ Implement local cache logic using `chrome.storage.local` (TTL, max entries).

* [ ] ⬜ Implement queueing/batching logic (optional for MVP — single request OK; batching recommended).

* [x] ✅ Implement call to backend `POST /v1/classify` (with installationId).

* [x] ✅ Implement backoff & retry policy, and offline flag (`lastBackendFailTs`).

* [x] ✅ Implement audit logging in storage (cap to 50 entries).

* AC: Service worker responds to content script messages and returns cached/remote/heuristic responses as expected.



---



# 5. Options & Popup UIs



## 5.1 Popup



* [x] ✅ Toggle on/off

* [x] ✅ Strictness controls (lenient/medium/strict)

* [x] ✅ Quick whitelist/blacklist buttons for active tab

* [x] ✅ Display count of hidden videos on current page (message from content script)

* AC: Popup toggles settings and reflection of active page count works.



## 5.2 Options page



* [x] ✅ Whitelist CRUD (add channel by ID/name, add video by URL)

* [x] ✅ Blacklist CRUD

* [x] ✅ Audit log view (last 50 entries, clear button)

* [x] ✅ PIN set/change flow (store salted hash; display warning about strength)

* [x] ✅ Telemetry opt-in toggle + Clear local data button

* AC: Options persist to `chrome.storage.local` and reflect in content behavior.



---



# 6. Backend proxy service



## 6.1 Basic server & endpoint



* [x] ✅ Create `server/` repo scaffold (Node/Express or serverless function).

* [x] ✅ Implement `POST /v1/classify` endpoint accepting JSON array or single object.

* [x] ✅ Validate `Origin` header against allowed extension ID(s).

* AC: Server responds 200 to valid requests and 401/403 to invalid origins.



Gemini integration







[x] ⬜ Implement prompt builder for gemini-2.5-flash-lite per Prompt Template.







[x] ⬜ Implement API call and parse response (strict JSON parsing).







[x] ⬜ Validate response fields (label, confidence, reason) and clamp confidence 0..1.







[x] ⬜ Truncate/limit input text to token/char limits before calling model.

* AC: For a test payload, server returns structured JSON matching the contract.



## 6.3 Security & rate-limiting



* [x] ⬜ Store GEMINI API key in environment (do not commit).

* [x] ⬜ Add basic rate limiting (per IP and per installation token).

* [x] ⬜ Add request logging (aggregate only; don't log raw titles by default).

* [x] ⬜ Health endpoint and simple metrics endpoint (optional).

* AC: Rate-limiting blocks excessive requests; key not present in repo.



---



# 7. Model prompt & contract QA



* [x] ✅ Prepare 10-20 test prompts with expected outputs to sanity check Gemini responses.

* [x] ✅ Implement server-side JSON validator and fallbacks (malformed → `uncertain`).

* [x] ✅ Add unit tests/mocks for backend response parsing.

* AC: Mocked model returns are parsed correctly and returned to extension.



---



# 8. Caching, batching & quotas



* [x] ✅ Implement cache TTL (default 24h).

* [x] ✅ Implement cache eviction strategy (LRU or size cap).

* [ ] ⬜ Decide batching plan: single vs batched requests; implement chosen approach.

* [x] ✅ Implement storage of installationId (UUID generated at first install).

* AC: Cache hits are used and backend calls reduce when cache present.



---



# 9. Security & privacy tasks



* [ ] ⬜ Ensure extension does not request extraneous permissions.

* [ ] ⬜ Document exactly what is sent to backend in privacy policy draft.

* [ ] ⬜ Implement PIN storage as salted hash and client-side verification.

* [ ] ⬜ Add option to clear all local data and instructions for data deletion.

* [ ] ⬜ Backend: whitelist extension origin; require installation token if chosen.

* AC: Privacy policy drafted; PIN not stored in plaintext.



---



# 10. Testing & QA



## 10.1 Unit tests



* [ ] ⬜ Heuristics functions

* [ ] ⬜ Video ID extraction

* [ ] ⬜ Storage utils (read/write/cache TTL)

* [ ] ⬜ Prompt builder & server parsing logic

* AC: Unit test coverage for core utils >= targeted threshold (team-defined).



## 10.2 Integration tests



* [ ] ⬜ Mock backend to verify end-to-end content script ↔ service worker ↔ backend flows.

* [ ] ⬜ Puppeteer/Playwright tests to load YouTube pages and assert DOM modifications for test vectors.

* AC: E2E smoke tests pass for major flows (home, search, watch recs).



## 10.3 Manual test vectors & acceptance



* [ ] ⬜ Build curated CSV/JSON with ~200 test videos (see DESIGN.md vectors).

* [ ] ⬜ Run manual acceptance tests under Lenient/Medium/Strict.

* [ ] ⬜ Record false positives & negatives and iterate heuristics/prompt.

* AC: False positive rate < 5% (target), false negative rate acceptable per product discussion.



---



# 11. UX polish & accessibility



* [ ] ⬜ Ensure placeholder and reveal buttons accessible (aria-labels, keyboard focus).

* [ ] ⬜ Add short “Why?” tooltip showing classifier reason and confidence.

* [ ] ⬜ Ensure options/popup responsive and readable.

* AC: Basic accessibility checks pass (keyboard navigable, buttons have aria labels).



---



# 12. Ops, monitoring & observability (backend)



* [ ] ⬜ Add basic logging/metrics (request count, 4xx/5xx, avg latency).

* [ ] ⬜ Add alerting for high error rates.

* [ ] ⬜ Prepare simple runbook for restarting backend & rolling back.

* AC: Metrics visible in chosen monitoring tool and runbook created.



---



# 13. Documentation & legal



* [ ] ⬜ Write privacy policy describing text-only data sent to backend, storage, opt-in telemetry, and deletion instructions.

* [ ] ] Write developer README for extension and backend with setup, build, deploy steps.

* [ ] ⬜ Prepare Chrome Web Store listing copy (short + long descriptions) including privacy summary.

* [ ] ⬜ Prepare FAQ for parents (how reveal/whitelist works, PIN).

* AC: All docs ready for store submission.



---



# 14. Release & store submission checklist



* [ ] ⬜ Final QA pass with test vector

* [ ] ⬜ Create extension icon assets and images for store

* [ ] ⬜ Pack extension and produce `.zip` for Chrome Web Store

* [ ] ⬜ Ensure privacy policy URL included in store listing

* [ ] ⬜ Backend deployed to production with env vars set (`GEMINI_API_KEY`, allowed origins)

* [ ] ⬜ Monitor initial rollout and be prepared to quick fix selector regressions

* AC: Extension published and backend live; monitoring in place.



---



# 15. Post-release follow-ups (short backlog)



* [ ] ⬜ Collect parental feedback UI to capture false positives/negatives.

* [ ] ⬜ Add optional on-device fallback classifier prototype.

* [ ] ⬜ Implement improved batching to lower costs.

* [ ] ⬜ Internationalization support (text labels + keywords).

* AC: Backlog created with prioritization for next sprint.



---



# 16. PR & code review checklist (for each PR)



* [ ] ⬜ Branch named sensibly (e.g., `feat/content-scraper`)

* [ ] ⬜ Tests added or existing tests updated

* [ ] ⬜ Linting and build pass in CI

* [ ] ⬜ No secrets in code

* [ ] ⬜ Short description and linked issue

* [ ] ⬜ Reviewer checklist ticked

* AC: PR approved and merged only when all checks pass.



---



# 17. Acceptance criteria summary (for release)



* [ ] ⬜ Extension hides/collapses/blur non-educational videos on YouTube feeds and search with heuristics+model according to strictness.

* [ ] ⬜ Whitelist/blacklist persist and override model decisions.

* [ ] ⬜ No API key in extension; backend proxies to Gemini.

* [ ] ⬜ Audit log present and functional locally.

* [ ] ⬜ Telemetry off by default and opt-in only.

* [ ] ⬜ Privacy policy published and store listing includes it.