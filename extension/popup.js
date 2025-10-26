
document.addEventListener('DOMContentLoaded', () => {
  const enabledCheckbox = document.getElementById('enabled');
  const strictnessSelect = document.getElementById('strictness');
  const whitelistButton = document.getElementById('whitelist');
  const blacklistButton = document.getElementById('blacklist');
  const hiddenCountSpan = document.getElementById('hidden-count');

  // Request hidden video count from content script
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { type: 'get_hidden_video_count' }, (response) => {
      if (response) {
        hiddenCountSpan.textContent = response.count;
      }
    });
  });

  // Load settings from storage
  chrome.storage.sync.get(['enabled', 'strictness'], (result) => {
    enabledCheckbox.checked = typeof result.enabled === 'boolean' ? result.enabled : true;
    strictnessSelect.value = result.strictness || 'medium';
  });

  // Save settings when changed
  enabledCheckbox.addEventListener('change', () => {
    chrome.storage.sync.set({ enabled: enabledCheckbox.checked });
  });

  strictnessSelect.addEventListener('change', () => {
    chrome.storage.sync.set({ strictness: strictnessSelect.value });
  });

  // Whitelist/Blacklist buttons
  whitelistButton.addEventListener('click', () => {
    // Logic to whitelist the current channel
    console.log('Whitelist button clicked');
  });

  blacklistButton.addEventListener('click', () => {
    // Logic to blacklist the current channel
    console.log('Blacklist button clicked');
  });

  // Listen for messages from the content script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'hidden_video_count') {
      hiddenCountSpan.textContent = request.count;
    }
  });
});
