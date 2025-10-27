import { hideVideo } from './ui-transformations.js';

/**
 * Extracts the YouTube video ID from a DOM node.
 * @param {HTMLElement} node The DOM node of the video card.
 * @returns {string|null} The video ID or null if not found.
 */
const extractVideoId = (node) => {
  const link = node.querySelector('a[href]');
  if (!link) {
    return null;
  }

  const href = link.getAttribute('href');
  const url = new URL(href, window.location.origin);

  if (url.pathname === '/watch') {
    return url.searchParams.get('v');
  }

  if (url.hostname === 'youtu.be') {
    return url.pathname.slice(1);
  }

  return null;
};

/**
 * Debounce function to limit the rate at which a function can be called.
 * @param {Function} func The function to debounce.
 * @param {number} delay The debounce delay in milliseconds.
 * @returns {Function} The debounced function.
 */
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

// Robust selectors for YouTube video cards
const VIDEO_SELECTORS = [
  'ytd-rich-item-renderer', // Home page, search results
  'ytd-video-renderer', // Sidebar recommendations
  'ytd-grid-video-renderer', // Channel pages
  'ytd-compact-video-renderer', // Playlists
];

let hiddenVideoCount = 0;

/**
 * Processes the video cards found on the page.
 */
const processVideos = () => {
  const videoElements = document.querySelectorAll(VIDEO_SELECTORS.join(', '));
  videoElements.forEach((element) => {
    if (element.dataset.processed) {
      return;
    }
    element.dataset.processed = true;

    const videoId = extractVideoId(element);
    if (videoId) {
      // Store videoId on the element for later retrieval
      element.dataset.videoId = videoId;
      chrome.runtime.sendMessage(
        { type: 'CLASSIFY_VIDEO', videoId },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error('Error sending message:', chrome.runtime.lastError.message);
            return;
          }
          if (response && response.status === 'queued') {
            // Video is queued for batch processing, do nothing for now
            console.log(`Video ${videoId} is queued for classification.`);
          }
        }
      );
    }
  });
};

// Create a MutationObserver to watch for changes in the DOM
const observer = new MutationObserver(debounce(processVideos, 300));

// Start observing the body for changes
observer.observe(document.body, {
  childList: true,
  subtree: true,
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'get_hidden_video_count') {
    sendResponse({ count: hiddenVideoCount });
  } else if (request.type === 'CLASSIFICATION_RESULT') {
    const { classifications } = request;
    if (classifications) {
      for (const videoId in classifications) {
        const classification = classifications[videoId];
        console.log(`Received classification for video ${videoId}:`, classification);
        if (classification.label !== 'educational') {
          const videoElement = document.querySelector(`[data-video-id="${videoId}"]`);
          if (videoElement && !videoElement.dataset.hidden) {
            console.log(`Hiding video ${videoId} classified as ${classification.label}`);
            hideVideo(videoElement);
            videoElement.dataset.hidden = true; // Mark as hidden to avoid recounting
            hiddenVideoCount++;
          }
        }
      }
      chrome.runtime.sendMessage({ type: 'hidden_video_count', count: hiddenVideoCount });
    }
  }
});

// Initial run on page load
processVideos();
