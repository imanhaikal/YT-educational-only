# YouTube Kid-Filter Backend

This is the backend for the YouTube Kid-Filter project. It is a Node.js server that acts as a proxy to the Gemini API.

## Features

*   Receives video metadata from the Chrome extension.
*   Calls the Gemini API to classify the video content.
*   Returns the classification results to the extension.
*   Securely stores the Gemini API key on the server.

## Setup

1.  Navigate to the `backend` directory.
2.  Install dependencies:

    ```bash
    npm install
    ```

3.  Create a `.env` file and add your Gemini API key:

    ```
    GEMINI_API_KEY=your_api_key
    ```

## Running the Server

To start the server, run the following command:

```bash
npm start
```

The server will run on `http://localhost:3000`.

## Development

To run the server in development mode, you can use the `npm run dev` command, which will automatically restart the server when files change.

### Building for Production

To build the server for production, run:

```bash
npm run build
```

This will create a `dist` directory with the bundled and minified code.

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
