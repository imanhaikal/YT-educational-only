import moment from 'moment';

const CACHE_TTL = 24 * 3600 * 1000; // 24 hours in milliseconds
const MAX_CACHE_ENTRIES = 100;
const BACKEND_URL = 'https://yt-educational-only.vercel.app/v1/classify';
const BACKOFF_DURATION = 5 * 60 * 1000; // 5 minutes
const AUDIT_LOG_MAX_ENTRIES = 50;
const YOUTUBE_API_KEY = 'AIzaSyDuTZCTPbJl0h_DufU7tzP5j15mbdQSsfk'; // TODO: Replace with your YouTube Data API key

async function addAuditLog(message) {
    const { auditLog = [] } = await new Promise(resolve => chrome.storage.local.get('auditLog', resolve));
    const timestamp = new Date().toISOString();
    auditLog.unshift(`[${timestamp}] ${message}`);
    if (auditLog.length > AUDIT_LOG_MAX_ENTRIES) {
        auditLog.length = AUDIT_LOG_MAX_ENTRIES;
    }
    await new Promise(resolve => chrome.storage.local.set({ auditLog }, resolve));
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get('installationId', (result) => {
    if (!result.installationId) {
      const installationId = self.crypto.randomUUID();
      chrome.storage.local.set({ installationId }, () => {
        console.log('Installation ID generated and stored:', installationId);
        addAuditLog('Extension installed.');
      });
    }
  });
});

async function fetchVideoMetadata(videoId) {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`YouTube API request failed with status: ${response.status}`);
    }
    const data = await response.json();
    if (data.items && data.items.length > 0) {
      const item = data.items[0];
      const duration = item.contentDetails.duration;
      const durationSec = duration ? moment.duration(duration).asSeconds() : 0;
      return {
        videoId: item.id,
        title: item.snippet.title,
        descriptionSnippet: item.snippet.description.substring(0, 200),
        channelName: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
        durationSec,
      };
    }
  } catch (error) {
    console.error('Error fetching video metadata:', error);
    addAuditLog(`Failed to fetch metadata for video ${videoId}. Error: ${error.message}`);
  }
  return null;
}

async function classifyVideos(videos) {
    const { installationId, lastBackendFailTs } = await new Promise(resolve => chrome.storage.local.get(['installationId', 'lastBackendFailTs'], resolve));

    if (lastBackendFailTs && (Date.now() - lastBackendFailTs < BACKOFF_DURATION)) {
        const message = `Backend is in backoff period. Skipping classification for ${videos.length} videos.`;
        console.log(message);
        addAuditLog(message);
        return null;
    }

    console.log('Sending videos to backend:', videos);

    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ videos, installationId }),
        });

        if (!response.ok) {
            throw new Error(`Backend request failed with status: ${response.status}`);
        }

        await new Promise(resolve => chrome.storage.local.remove('lastBackendFailTs', resolve));

        const data = await response.json();
        const message = `Successfully classified ${videos.length} videos.`;
        console.log(message);
        addAuditLog(message);
        return data.classifications;
    } catch (error) {
        console.error('Error classifying videos:', error);
        const message = `Failed to classify videos. Error: ${error.message}`;
        addAuditLog(message);
        await new Promise(resolve => chrome.storage.local.set({ lastBackendFailTs: Date.now() }, resolve));
        return null;
    }
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'process-video-queue') {
        const videosToProcess = Array.from(videoQueue.values());
        videoQueue.clear();

        if (videosToProcess.length === 0) {
            addAuditLog('Alarm triggered, but video queue was empty.');
            return;
        }

        addAuditLog(`Processing queue with ${videosToProcess.length} videos.`);
        const classifications = await classifyVideos(videosToProcess);

        if (classifications) {
            const allItems = await new Promise(resolve => chrome.storage.local.get(null, resolve));
            const cacheKeys = Object.keys(allItems).filter(k => k.startsWith('video-classification-'));
            let newCacheEntries = {};

            for (const videoId in classifications) {
                const classification = classifications[videoId];
                const cacheKey = `video-classification-${videoId}`;
                newCacheEntries[cacheKey] = { classification, timestamp: Date.now() };
            }

            if (cacheKeys.length + Object.keys(newCacheEntries).length > MAX_CACHE_ENTRIES) {
                // Simple eviction: remove oldest entries. A more sophisticated LRU would be better.
                let sortedCache = cacheKeys.map(key => ({ key, timestamp: allItems[key].timestamp })).sort((a, b) => a.timestamp - b.timestamp);
                const numToRemove = Math.max(0, cacheKeys.length + Object.keys(newCacheEntries).length - MAX_CACHE_ENTRIES);
                const keysToRemove = sortedCache.slice(0, numToRemove).map(item => item.key);
                if (keysToRemove.length > 0) {
                    await new Promise(resolve => chrome.storage.local.remove(keysToRemove, resolve));
                    addAuditLog(`Pruned ${keysToRemove.length} old cache entries.`);
                }
            }

            await new Promise(resolve => chrome.storage.local.set(newCacheEntries, resolve));
            addAuditLog(`Cached ${Object.keys(newCacheEntries).length} new classifications.`);

            // Notify content scripts about the new classifications
            chrome.tabs.query({ url: "*://www.youtube.com/*" }, (tabs) => {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, { type: 'CLASSIFICATION_RESULT', classifications })
                        .catch(error => {
                            if (error.message.includes('Receiving end does not exist')) {
                                console.log(`Content script in tab ${tab.id} not ready to receive message.`);
                            } else {
                                console.error(`Error sending message to tab ${tab.id}:`, error);
                            }
                        });
                });
            });
        }
    }
});

let videoQueue = new Map();
const BATCH_DELAY_MINUTES = 0; 

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'CLASSIFY_VIDEO') {
        const { videoId } = request;
        const cacheKey = `video-classification-${videoId}`;

        (async () => {
            const result = await new Promise(resolve => chrome.storage.local.get(cacheKey, resolve));
            const cachedItem = result[cacheKey];
            if (cachedItem && (Date.now() - cachedItem.timestamp < CACHE_TTL)) {
                const message = `Returning cached classification for video ${videoId}: ${cachedItem.classification}`;
                console.log(message);
                addAuditLog(message);
                sendResponse({ classification: cachedItem.classification });
                return;
            }

            const metadata = await fetchVideoMetadata(videoId);
            if (!metadata) {
                sendResponse({ error: 'Failed to fetch metadata' });
                return;
            }

            console.log('No valid cache entry for videoId, adding to queue:', videoId);
            videoQueue.set(videoId, metadata);
            // Ensure the alarm is set. If it already exists, this does nothing.
            chrome.alarms.get('process-video-queue', (alarm) => {
                if (!alarm) {
                    chrome.alarms.create('process-video-queue', { delayInMinutes: BATCH_DELAY_MINUTES });
                    addAuditLog(`Alarm "process-video-queue" created with a ${BATCH_DELAY_MINUTES * 60}s delay.`);
                }
            });

            // We will respond asynchronously later after batch processing
            // For now, we can send a response indicating it's queued.
            sendResponse({ status: 'queued' });
        })();

        return true;
    } else if (request.type === 'hidden_video_count') {
        chrome.action.setBadgeText({ text: request.count.toString() });
    }
});
