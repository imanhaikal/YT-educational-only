const { GoogleGenerativeAI } = require("@google/generative-ai");

// Access your API key as an environment variable (see "Set up your API key" page)
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// For now, using a placeholder. Replace with your actual API key.
const genAI = new GoogleGenerativeAI("YOUR_API_KEY");

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

const validateResponse = (response) => {
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
};

const callGemini = async (prompt) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-lite"});
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const parsedResponse = JSON.parse(text);
    return validateResponse(parsedResponse);
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return { label: "uncertain", confidence: 0.0, reason: "Error processing request." };
  }
};

module.exports = { buildPrompt, callGemini };
