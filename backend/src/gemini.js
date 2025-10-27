const { GoogleAuth } = require('google-auth-library');
const https = require('https');

const auth = new GoogleAuth({
  scopes: 'https://www.googleapis.com/auth/generative-language',
});

const truncateText = (videoMetadata) => {
  const { descriptionSnippet, transcriptSnippet } = videoMetadata;
  const combinedLength = (descriptionSnippet?.length || 0) + (transcriptSnippet?.length || 0);

  if (combinedLength > 4000) {
    const remainingLength = 4000;
    const descriptionLength = descriptionSnippet?.length || 0;
    const transcriptSnippetLength = transcriptSnippet?.length || 0;

    if (transcriptSnippetLength > remainingLength) {
      videoMetadata.transcriptSnippet = transcriptSnippet.slice(0, remainingLength);
      videoMetadata.descriptionSnippet = "";
    } else if (descriptionLength > remainingLength - transcriptSnippetLength) {
      videoMetadata.descriptionSnippet = descriptionSnippet.slice(0, remainingLength - transcriptSnippetLength);
    }
  }

  return videoMetadata;
}

const buildPrompt = (videoMetadata) => {
  const { title, descriptionSnippet, channelName, transcriptSnippet, isEducationalChannel } = truncateText(videoMetadata);

  let prompt = `Please classify the following YouTube video as "educational" or "non-educational" based on the provided metadata. Your focus should be on identifying content that offers intellectual value, promotes learning, or teaches a skill.

  **Video Metadata:**
  * **Title:** "${title}"
  * **Channel:** "${channelName}"
  * **Description:** "${descriptionSnippet}"
  * **Transcript Snippet:** "${transcriptSnippet}"

  **Classification Guidelines:**

  *   **Educational:** Content that is primarily designed to teach, inform, or develop a skill. This includes, but is not limited to:
      *   Documentaries and educational series (e.g., from channels like TED, Kurzgesagt, SmarterEveryDay).
      *   Tutorials and how-to guides (e.g., coding tutorials, DIY projects, academic lectures).
      *   In-depth analyses of current events, history, science, or art.
      *   Content that encourages critical thinking and intellectual curiosity.

  *   **Non-Educational:** Content that is primarily for entertainment and lacks significant intellectual value. This includes:
      *   Pranks, challenges, and reaction videos.
      *   Let's Plays and gameplay videos without instructional commentary.
      *   Vlogs, "day in the life" videos, and celebrity gossip.
      *   Music videos, ASMR, and other content designed for passive consumption.

  When in doubt, lean towards classifying a video as "non-educational" to err on the side of caution.
  `

  if (isEducationalChannel) {
    prompt += `
  **Important Note:** This video is from a known educational channel. Please classify it as "educational".
    `
  }
  
  prompt += `
  **Output Format:**

  Return a JSON object with the following structure:
  {
    "label": "educational" | "non-educational",
    "confidence": 0.00-1.00,
    "reason": "A brief justification for your classification (under 20 words)."
  }
  `
  return prompt;
};

const validateResponse = (responseText) => {
  console.log('Gemini API response:', responseText);
  try {
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    const json = jsonMatch ? jsonMatch[1] : responseText;
    const response = JSON.parse(json);

    if (!response || typeof response !== 'object') {
      return { label: "non-educational", confidence: 0.0, reason: "Invalid response format." };
    }

    const { label, confidence, reason } = response;

    if (!label || !["educational", "non-educational"].includes(label)) {
      return { label: "non-educational", confidence: 0.0, reason: "Invalid or missing label." };
    }

    if (typeof confidence !== 'number') {
      return { label: "non-educational", confidence: 0.0, reason: "Invalid or missing confidence." };
    }

    const clampedConfidence = Math.max(0, Math.min(1, confidence));

    if (!reason || typeof reason !== 'string') {
      return { label: "non-educational", confidence: 0.0, reason: "Invalid or missing reason." };
    }

    return { label, confidence: clampedConfidence, reason };
  } catch {
    return { label: "non-educational", confidence: 0.0, reason: "Malformed JSON response." };
  }
};

const callGemini = async (prompt) => {
    try {
        const client = await auth.getClient();
        const accessToken = (await client.getAccessToken()).token;

        const model = "gemini-flash-lite-latest";
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
                                resolve({ label: "non-educational", confidence: 0.0, reason: "Invalid response structure." });
                            }
                        } catch (e) {
                            console.error("Error parsing Gemini API response:", e);
                            resolve({ label: "non-educational", confidence: 0.0, reason: "Error parsing response." });
                        }
                    } else {
                        console.error("Error response from Gemini API:", body);
                        resolve({ label: "non-educational", confidence: 0.0, reason: `HTTP error! status: ${res.statusCode}` });
                    }
                });
            });

            req.on('error', (error) => {
                console.error("Error calling Gemini API:", error);
                resolve({ label: "non-educational", confidence: 0.0, reason: "Error processing request." });
            });

            req.write(data);
            req.end();
        });

    } catch (error) {
        console.error("Error getting access token:", error);
        return { label: "non-educational", confidence: 0.0, reason: "Error getting access token." };
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