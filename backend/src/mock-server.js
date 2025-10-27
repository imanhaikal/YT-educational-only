
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(bodyParser.json());

const testVideosPath = path.join(__dirname, '..', '..', 'test_videos.json');
const testVideos = JSON.parse(fs.readFileSync(testVideosPath, 'utf-8'));

const videoMap = new Map(testVideos.map(video => [video.videoId, video.category]));

app.post('/v1/classify', (req, res) => {
  const { videos } = req.body;
  const classifications = {};
  for (const video of videos) {
    const category = videoMap.get(video.videoId);
    if (category) {
      let confidence;
      if (category === 'educational') {
        confidence = Math.random() * 0.3 + 0.7; // 0.7 - 1.0
      } else { // non-educational
        confidence = Math.random() * 0.4 + 0.6; // 0.6 - 1.0
      }
      classifications[video.videoId] = {
        label: category,
        confidence: confidence,
        reason: 'Mock classification'
      };
    } else {
      classifications[video.videoId] = {
        label: 'uncertain',
        confidence: 0.5,
        reason: 'Not in mock DB'
      };
    }
  }
  res.json({ classifications });
});

const port = 3000;
app.listen(port, () => {
  console.log(`Mock backend listening at http://localhost:${port}`);
});
