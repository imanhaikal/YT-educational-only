const CACHE_TTL = 24 * 3600 * 1000; // 24 hours in milliseconds
const MAX_CACHE_ENTRIES = 100;
const BACKEND_URL = 'http://localhost:3000/v1/classify';
const BACKOFF_DURATION = 5 * 60 * 1000; // 5 minutes
const AUDIT_LOG_MAX_ENTRIES = 50;

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

async function classifyVideo(videoId) {
    const { installationId, lastBackendFailTs } = await new Promise(resolve => chrome.storage.local.get(['installationId', 'lastBackendFailTs'], resolve));

    if (lastBackendFailTs && (Date.now() - lastBackendFailTs < BACKOFF_DURATION)) {
        const message = `Backend is in backoff period. Skipping classification for videoId: ${videoId}`;
        console.log(message);
        addAuditLog(message);
        return null;
    }

    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ videoId, installationId }),
        });

        if (!response.ok) {
            throw new Error(`Backend request failed with status: ${response.status}`);
        }

        // If successful, clear the backoff timestamp
        await new Promise(resolve => chrome.storage.local.remove('lastBackendFailTs', resolve));

        const data = await response.json();
        const message = `Successfully classified video ${videoId} as ${data.classification}`;
        console.log(message);
        addAuditLog(message);
        return data.classification;
    } catch (error) {
        console.error('Error classifying video:', error);
        const message = `Failed to classify video ${videoId}. Error: ${error.message}`;
        addAuditLog(message);
        // If failed, set the backoff timestamp
        await new Promise(resolve => chrome.storage.local.set({ lastBackendFailTs: Date.now() }, resolve));
        return null; // or some default/error state
    }
}

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

            console.log('No valid cache entry for videoId:', videoId);
            const classification = await classifyVideo(videoId);

            if (classification) {
                const newItem = { classification, timestamp: Date.now() };
                const allItems = await new Promise(resolve => chrome.storage.local.get(null, resolve));
                const cacheKeys = Object.keys(allItems).filter(k => k.startsWith('video-classification-'));

                if (cacheKeys.length >= MAX_CACHE_ENTRIES) {
                    let oldestKey = null;
                    let oldestTimestamp = Date.now();
                    for (const key of cacheKeys) {
                        if (allItems[key] && allItems[key].timestamp < oldestTimestamp) {
                            oldestTimestamp = allItems[key].timestamp;
                            oldestKey = key;
                        }
                    }
                    if (oldestKey) {
                        await new Promise(resolve => chrome.storage.local.remove(oldestKey, resolve));
                        console.log('Pruned oldest cache entry:', oldestKey);
                    }
                }
                await new Promise(resolve => chrome.storage.local.set({
                    [cacheKey]: newItem
                }, resolve));
                console.log('Cached new classification for videoId:', videoId);
            }

            sendResponse({ classification });
        })();

        return true;
    }
});
