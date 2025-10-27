
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const mockClassifications = {
  'dQw4w9WgXcQ': { label: 'non-educational', confidence: 0.9, reason: 'Music video' },
  'g-h_i_j': { label: 'educational', confidence: 0.8, reason: 'Science video' },
};

app.post('/v1/classify', (req, res) => {
  const { videos } = req.body;
  const classifications = {};
  for (const video of videos) {
    classifications[video.videoId] = mockClassifications[video.videoId] || { label: 'uncertain', confidence: 0.5, reason: 'Not in mock DB' };
  }
  res.json({ classifications });
});

const port = 3000;
app.listen(port, () => {
  console.log(`Mock backend listening at http://localhost:${port}`);
});
