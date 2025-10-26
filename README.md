# YouTube Kid-Filter

**YouTube Kid-Filter** is a Chrome extension designed for parents to create a safer and more educational browsing experience for their children on YouTube. It intelligently hides or de-emphasizes videos that are non-educational or of low value, using the power of Google's Gemini AI model for classification.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [How It Works](#how-it-works)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Extension Setup](#extension-setup)
- [Development](#development)
  - [Conventions](#conventions)
  - [Testing](#testing)
- [License](#license)

---

## Overview

The primary goal of this extension is to filter out distracting and non-educational content on YouTube, such as clickbait, pranks, and entertainment-only videos. By analyzing video metadata like titles, descriptions, and channel information, the extension classifies content and applies parent-configured rules to either hide, blur, or collapse inappropriate video thumbnails.

This project consists of two main parts:
1.  A **Chrome Extension (Manifest V3)** that runs in the user's browser to identify and filter content directly on YouTube pages.
2.  A **Node.js Backend Proxy** that securely communicates with the Gemini AI model to classify video content, ensuring that the API key remains private and secure.

## Features

*   **AI-Powered Content Classification:** Uses `gemini-2.5-flash-lite` to determine if a video is "educational" or "non-educational".
*   **Adjustable Strictness Levels:** Parents can choose between "Lenient", "Medium", and "Strict" filtering levels to match their preferences.
*   **Customizable Actions:** Non-educational content can be hidden, blurred, or collapsed from view.
*   **Whitelist & Blacklist:** Parents can always allow or block specific channels or videos, overriding the AI's classification.
*   **PIN-Protected Override:** A hidden video can be temporarily revealed using a parent-set PIN.
*   **Local Audit Log:** Parents can review a log of the most recent filtering actions taken by the extension.
*   **Privacy-Focused:** No personal data is collected by default. All filtering rules and logs are stored locally on your browser. Telemetry is strictly opt-in.

## How It Works

The architecture is designed for security and performance:

1.  **Content Script:** Runs on YouTube pages, observes for new videos, and extracts metadata (title, channel, etc.).
2.  **Local Heuristics:** The script first applies fast, local rules (e.g., checking whitelists, keywords) to make quick decisions.
3.  **Service Worker:** If a video's content is uncertain, this background script sends a request to the backend. It also manages a local cache to avoid re-classifying the same video, reducing API calls and improving speed.
4.  **Backend Proxy:** A secure Node.js server receives the request, calls the Gemini API with a server-side API key, and returns the classification result. The API key is never exposed to the browser.
5.  **UI Update:** The content script receives the classification and applies the parent's chosen action (hide, blur, etc.) to the video on the page.

```
[YouTube Page (Content Script)]  <--messages-->  [Extension Service Worker]
      |                                                  |
      | (POST classify request)                          |
      v                                                  v
               [Backend Proxy (HTTPS)]  --(calls)-->  [Gemini AI Model]
```

## Technologies Used

*   **Frontend:** Chrome Extension (Manifest V3)
*   **Backend:** Node.js with Express
*   **AI Model:** Google Gemini 2.5 Flash-Lite
*   **Bundler:** Webpack/esbuild (or similar)

## Getting Started

Follow these instructions to set up and run the project locally for development.

### Prerequisites

*   [Node.js](https://nodejs.org/) (LTS version recommended)
*   [Google AI API Key](https://aistudio.google.com/app/apikey)

### Backend Setup

1.  Navigate to the `backend` directory:
    ```sh
    cd backend
    ```
2.  Install dependencies:
    ```sh
    npm install
    ```
3.  Create a `.env` file and add your Gemini API key:
    ```
    GEMINI_API_KEY=YOUR_API_KEY_HERE
    ```
4.  Start the server:
    ```sh
    npm start
    ```
    The backend will be running at `http://localhost:3000`.

### Extension Setup

1.  Navigate to the `extension` directory:
    ```sh
    cd extension
    ```
2.  Install dependencies:
    ```sh
    npm install
    ```
3.  Build the extension:
    ```sh
    npm run build
    ```
    This will create a `dist` directory containing the bundled extension files.
4.  Load the extension in Chrome:
    *   Open Chrome and navigate to `chrome://extensions`.
    *   Enable "Developer mode" in the top right corner.
    *   Click "Load unpacked".
    *   Select the `extension/dist` directory.

## Development

### Conventions

The project follows a consistent code style enforced by a linter. Key design principles are outlined in `DESIGN.md`:
*   **Code Style:** Enforced by a linter.
*   **Commit Messages:** Should be clear, concise, and follow a conventional format.
*   **Branching:** Use feature branches for new development.

### Testing

The project includes a plan for unit, integration, and end-to-end tests to ensure quality and stability. See `DESIGN.md` for the detailed testing strategy.

*   **Unit Tests:** Verify individual functions and components in isolation.
*   **Integration Tests:** Test the interaction between different parts of the extension (e.g., content script and service worker).
*   **End-to-End Tests:** Use tools like Puppeteer to simulate user interaction on live YouTube pages.

## License

This project is licensed under the terms of the [LICENSE](LICENSE) file.
