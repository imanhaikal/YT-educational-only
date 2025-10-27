require('dotenv').config();
console.log("GOOGLE_APPLICATION_CREDENTIALS:", process.env.GOOGLE_APPLICATION_CREDENTIALS);
const express = require('express');
const { classifyVideosInBatch } = require('./src/gemini');
const app = express();
const morgan = require('morgan');
const promBundle = require('express-prom-bundle');

const metricsMiddleware = promBundle({includeMethod: true, includePath: true});
app.use(metricsMiddleware);

app.use(express.json());
app.use(morgan('tiny'));
const port = 3000;

app.use((req, res, next) => {
  const origin = req.get('Origin');
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each installationId to 100 requests per `window` (here, per 15 minutes)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	lazy: false, // Disable lazy checking
  keyGenerator: (req) => {
    return req.body.installationId;
  },
  skip: (req) => {
    return req.method === 'OPTIONS';
  }
});

app.use('/v1/classify', limiter);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.post('/v1/classify', async (req, res) => {
  const { videos, installationId } = req.body;
  console.log(`Received classification request from installationId: ${installationId}`);
  if (!Array.isArray(videos)) {
    return res.status(400).json({ message: 'Request body must be an array of video metadata objects.' });
  }

  const classifications = await classifyVideosInBatch(videos);
  res.json({ classifications });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
