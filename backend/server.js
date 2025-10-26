const express = require('express');
const { buildPrompt, callGemini } = require('./src/gemini');
const app = express();
const port = 3000;

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'chrome-extension://andnjmfcpffbafhgjmnhfcklbgjblkih'];

app.use((req, res, next) => {
  const origin = req.get('Origin');
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      return res.status(204).end();
    }
    next();
  } else {
    return res.status(403).json({ message: 'Forbidden' });
  }
});

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/v1/classify', async (req, res) => {
  const prompt = buildPrompt(req.body);
  const result = await callGemini(prompt);
  res.json(result);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
