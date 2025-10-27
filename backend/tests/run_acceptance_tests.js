const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const testVideosPath = path.join(__dirname, '..', '..', 'test_videos.json');
const testVideos = JSON.parse(fs.readFileSync(testVideosPath, 'utf-8'));

const strictnessLevels = {
  lenient: 0.90,
  medium: 0.75,
  strict: 0.60,
};

const runTests = async () => {
  const mockServer = spawn('node', [path.join(__dirname, '..', 'src', 'mock-server.js')]);

  mockServer.stdout.on('data', (data) => {
    console.log(`Mock server: ${data}`);
  });

  mockServer.stderr.on('data', (data) => {
    console.error(`Mock server error: ${data}`);
  });

  // Wait for the mock server to start
  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    const response = await axios.post('http://localhost:3000/v1/classify', { videos: testVideos });
    const { classifications } = response.data;

    for (const level in strictnessLevels) {
      let falsePositives = 0;
      let falseNegatives = 0;
      let truePositives = 0;
      let trueNegatives = 0;

      for (const video of testVideos) {
        const result = classifications[video.videoId];
        const groundTruth = video.category;

        const confidenceThreshold = strictnessLevels[level];

        let predicted;
        if (result.confidence >= confidenceThreshold) {
          predicted = result.label;
        } else {
          predicted = 'educational'; // If confidence is low, we don't hide, so it's effectively educational
        }

        if (groundTruth === 'educational' && predicted === 'non-educational') {
          falsePositives++;
        } else if (groundTruth === 'non-educational' && predicted === 'educational') {
          falseNegatives++;
        } else if (groundTruth === 'educational' && predicted === 'educational') {
          truePositives++;
        } else if (groundTruth === 'non-educational' && predicted === 'non-educational') {
          trueNegatives++;
        }
      }

      console.log(`\nResults for ${level} strictness (threshold: ${strictnessLevels[level]}):`);
      console.log(`  True Positives (Educational correctly identified): ${truePositives}`);
      console.log(`  True Negatives (Non-educational correctly identified): ${trueNegatives}`);
      console.log(`  False Positives (Educational incorrectly hidden): ${falsePositives}`);
      console.log(`  False Negatives (Non-educational incorrectly shown): ${falseNegatives}`);

      const falsePositiveRate = (falsePositives / (falsePositives + truePositives)) * 100;
      const falseNegativeRate = (falseNegatives / (falseNegatives + trueNegatives)) * 100;

      console.log(`  False Positive Rate: ${falsePositiveRate.toFixed(2)}%`);
      console.log(`  False Negative Rate: ${falseNegativeRate.toFixed(2)}%`);
    }

  } catch (error) {
    console.error('Error running tests:', error.message);
  } finally {
    mockServer.kill();
  }
};

runTests();
