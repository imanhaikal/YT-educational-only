# GEMINI.md

## Project Overview

This project is a Chrome extension called "YouTube Kid-Filter". Its purpose is to hide or de-emphasize YouTube videos that are non-educational and offer little value for children. The extension uses a backend proxy to classify video content using the `gemini-2.5-flash-lite` model.

The project is currently in the design and planning phase. The `DESIGN.md`, `REQUIREMENTS.md`, and `TASKS.md` files provide a comprehensive overview of the project's architecture, features, and implementation plan.

## Key Technologies

*   **Frontend:** Chrome Extension (Manifest V3)
*   **Backend:** Node.js with Express (or a serverless equivalent)
*   **AI Model:** Google Gemini 2.5 Flash-Lite

## Architecture

The architecture consists of three main components:

1.  **Content Script:** Runs on YouTube pages, scrapes video metadata, and applies UI changes.
2.  **Service Worker:** A background script that handles communication between the content script and the backend, manages caching, and implements business logic.
3.  **Backend Proxy:** A secure server that receives requests from the extension, calls the Gemini API with a server-side API key, and returns the classification results.

## Building and Running

The project is not yet implemented. However, the `TASKS.md` file outlines the steps to build and run the project.

### Backend

1.  Navigate to the `backend` directory.
2.  Install dependencies: `npm install`
3.  Start the server: `npm start`

### Extension

1.  Navigate to the `extension` directory.
2.  Install dependencies: `npm install`
3.  Build the extension: `npm run build`
4.  Load the unpacked extension in Chrome from the `dist` directory.

## Development Conventions

The `DESIGN.md` file outlines the following development conventions:

*   **Code Style:** The project will follow a consistent code style, enforced by a linter.
*   **Testing:** The project will have unit tests, integration tests, and end-to-end tests.
*   **Commit Messages:** Commit messages should be clear, concise, and follow a conventional format.
*   **Branching:** The project will use a Git branching model, with feature branches for new development.
