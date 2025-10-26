const { GoogleAuth } = require('google-auth-library');
const https = require('https');

const auth = new GoogleAuth({
  scopes: 'https://www.googleapis.com/auth/generative-language',
});

const truncateText = (videoMetadata) => {
  const { description, transcriptSnippet } = videoMetadata;
  const combinedLength = (description?.length || 0) + (transcriptSnippet?.length || 0);

  if (combinedLength > 4000) {
    const remainingLength = 4000;
    const descriptionLength = description?.length || 0;
    const transcriptSnippetLength = transcriptSnippet?.length || 0;

    if (transcriptSnippetLength > remainingLength) {
      videoMetadata.transcriptSnippet = transcriptSnippet.slice(0, remainingLength);
      videoMetadata.description = "";
    } else if (descriptionLength > remainingLength - transcriptSnippetLength) {
      videoMetadata.description = description.slice(0, remainingLength - transcriptSnippetLength);
    }
  }

  return videoMetadata;
}

const buildPrompt = (videoMetadata) => {
  const { title, description, channelName, transcriptSnippet } = truncateText(videoMetadata);

  const prompt = `Classify the following YouTube video as "educational", "non-educational", or "uncertain" based ONLY on these fields:

{"title":"${title}", "description":"${description}", "channel":"${channelName}", "transcript_snippet":"${transcriptSnippet}"}

Rules:

- "educational": teaches facts/skills/concepts; tutorials, lectures, explainer content.
- "non-educational": entertainment-only (pranks, mukbang, reaction, gameplay with no instruction), clickbait, sensationalist, ASMR, challenges.

Return JSON only: {"label":"educational"|"non-educational"|"uncertain","confidence":0.00-1.00,"reason":"short justification, <=20 words"}`;

  return prompt;
};

const validateResponse = (responseText) => {
  try {
    const response = JSON.parse(responseText);

    if (!response || typeof response !== 'object') {
      return { label: "uncertain", confidence: 0.0, reason: "Invalid response format." };
    }

    const { label, confidence, reason } = response;

    if (!label || !["educational", "non-educational", "uncertain"].includes(label)) {
      return { label: "uncertain", confidence: 0.0, reason: "Invalid or missing label." };
    }

    if (typeof confidence !== 'number') {
      return { label: "uncertain", confidence: 0.0, reason: "Invalid or missing confidence." };
    }

    const clampedConfidence = Math.max(0, Math.min(1, confidence));

    if (!reason || typeof reason !== 'string') {
      return { label: "uncertain", confidence: 0.0, reason: "Invalid or missing reason." };
    }

    return { label, confidence: clampedConfidence, reason };
  } catch {
    return { label: "uncertain", confidence: 0.0, reason: "Malformed JSON response." };
  }
};

const callGemini = async (prompt) => {
    try {
        const client = await auth.getClient();
        const accessToken = (await client.getAccessToken()).token;

        const model = "gemini-2.5-flash-lite";
        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/${model}:generateContent`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        };

        const data = JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        return new Promise((resolve) => {
            const req = https.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => {
                    body += chunk;
                });
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            const result = JSON.parse(body);
                            if (result.candidates && result.candidates.length > 0 && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts.length > 0) {
                                const text = result.candidates[0].content.parts[0].text;
                                resolve(validateResponse(text));
                            } else {
                                console.error("Invalid response structure from Gemini API:", body);
                                resolve({ label: "uncertain", confidence: 0.0, reason: "Invalid response structure." });
                            }
                        } catch (e) {
                            console.error("Error parsing Gemini API response:", e);
                            resolve({ label: "uncertain", confidence: 0.0, reason: "Error parsing response." });
                        }
                    } else {
                        console.error("Error response from Gemini API:", body);
                        resolve({ label: "uncertain", confidence: 0.0, reason: `HTTP error! status: ${res.statusCode}` });
                    }
                });
            });

            req.on('error', (error) => {
                console.error("Error calling Gemini API:", error);
                resolve({ label: "uncertain", confidence: 0.0, reason: "Error processing request." });
            });

            req.write(data);
            req.end();
        });

    } catch (error) {
        console.error("Error getting access token:", error);
        return { label: "uncertain", confidence: 0.0, reason: "Error getting access token." };
    }
};

const classifyVideosInBatch = async (videos) => {
  const promises = videos.map(video => {
    const prompt = buildPrompt(video);
    return callGemini(prompt);
  });

  const results = await Promise.all(promises);

  const classifications = videos.reduce((acc, video, index) => {
    acc[video.videoId] = results[index];
    return acc;
  }, {});

  return classifications;
};

module.exports = { buildPrompt, callGemini, validateResponse, classifyVideosInBatch };