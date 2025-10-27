# YouTube Kid-Filter Extension

This is the Chrome extension for the YouTube Kid-Filter project. It is responsible for:

*   Scraping video metadata from YouTube pages.
*   Sending video metadata to the backend for classification.
*   Applying UI changes to hide or de-emphasize non-educational videos.

## Setup

1.  Navigate to the `extension` directory.
2.  Install dependencies:

    ```bash
    npm install
    ```

## Building the Extension

To build the extension, run the following command:

```bash
npm run build
```

This will create a `dist` directory with the packed extension files.

## Running the Extension

1.  Open Google Chrome.
2.  Go to `chrome://extensions`.
3.  Enable "Developer mode."
4.  Click "Load unpacked."
5.  Select the `extension/dist` directory.

## Development

To run the extension in development mode, you can use the `npm run build` command with a watch flag to automatically rebuild the extension when files change. (This is not yet implemented in `build.js`)

### Linting

To lint the code, run:

```bash
npm run lint
```

### Testing

To run the unit tests, run:

```bash
npm test
```

To run the end-to-end tests, run:

```bash
npm run test:e2e
```
