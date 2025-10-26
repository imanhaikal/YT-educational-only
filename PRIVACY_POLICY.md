# Privacy Policy for YouTube Kid-Filter

Last updated: October 27, 2025

This Privacy Policy describes how YouTube Kid-Filter ("the extension", "we", "us", or "our") collects, uses, and discloses your information when you use our browser extension.

## Information We Collect

The extension is designed to minimize data collection. However, to provide the video classification service, we need to collect the following information:

### Video Metadata

When you are on a YouTube page, the extension automatically collects metadata from the videos displayed on the page. This metadata is sent to our backend server for classification. The metadata we collect for each video includes:

*   **Video ID:** The unique identifier for the YouTube video.
*   **Title:** The title of the video.
*   **Description Snippet:** A short snippet of the video's description.
*   **Channel Name:** The name of the channel that uploaded the video.
*   **Channel ID:** The unique identifier for the YouTube channel.
*   **Duration:** The duration of the video in seconds.

This information is used solely for the purpose of classifying the video as "educational", "non-educational", or "uncertain".

### Installation Identifier

When you install the extension, we generate a unique, random installation identifier (UUID). This identifier is sent to our backend with each request. We use this identifier for the following purposes:

*   To prevent abuse of our service (e.g., rate limiting).
*   For aggregate statistical analysis of extension usage.

The installation identifier is not linked to any personal information and cannot be used to identify you.

## How We Use Your Information

The information we collect is used exclusively for the following purposes:

*   **To classify video content:** We use the video metadata to classify videos and hide those that are deemed non-educational.
*   **To improve our service:** We may use aggregated and anonymized data to improve the accuracy of our classification model and the overall performance of the extension.

## Information We Do Not Collect

We do not collect any personally identifiable information (PII). This includes, but is not limited to:

*   Your IP address
*   Your browsing history (other than the YouTube video metadata mentioned above)
*   Your email address or any other contact information
*   Any information from your Google account

## Data Retention

Video metadata sent to our backend is not stored or logged. The data is used for in-memory processing to classify the video and is then discarded.

We may store the classification results (the label "educational", "non-educational", or "uncertain") for a video ID in a cache to improve performance and reduce costs. This cache does not contain any personal information.

## Third-Party Services

We use the Google Gemini API to classify video content. The video metadata (title, description snippet, channel name) is sent to the Gemini API for processing. We do not send the video ID or any other identifying information to the Gemini API. You can find more information about Google's privacy policy here: [https://policies.google.com/privacy](https://policies.google.com/privacy)

## Security

We take reasonable measures to protect the information we collect from loss, theft, misuse, and unauthorized access, disclosure, alteration, and destruction. Our backend server is configured to only accept requests from the extension's origin.

## Changes to This Privacy Policy

We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.

## Contact Us

If you have any questions about this Privacy Policy, please open an issue on our GitHub repository.
