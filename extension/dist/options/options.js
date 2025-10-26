const whitelistForm = document.getElementById('whitelist-form');
const whitelistInput = document.getElementById('whitelist-input');
const whitelistEl = document.getElementById('whitelist');

const blacklistForm = document.getElementById('blacklist-form');
const blacklistInput = document.getElementById('blacklist-input');
const blacklistEl = document.getElementById('blacklist');

const auditLogEl = document.getElementById('audit-log');
const clearLogButton = document.getElementById('clear-log');

const pinForm = document.getElementById('pin-form');
const pinInput = document.getElementById('pin-input');

const telemetryOptInCheckbox = document.getElementById('telemetry-opt-in');
const clearDataButton = document.getElementById('clear-data');

const renderList = (list, el, listName) => {
  el.innerHTML = '';
  list.forEach((item, index) => {
    const li = document.createElement('li');
    li.textContent = item;
    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.addEventListener('click', () => {
      list.splice(index, 1);
      chrome.storage.local.set({ [listName]: list }, () => {
        renderList(list, el, listName);
        addToAuditLog(`Removed "${item}" from ${listName}`);
      });
    });
    li.appendChild(removeButton);
    el.appendChild(li);
  });
};

const renderAuditLog = (log) => {
  auditLogEl.innerHTML = '';
  log.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = `[${new Date(item.timestamp).toLocaleString()}] ${item.message}`;
    auditLogEl.appendChild(li);
  });
};

const addToAuditLog = (message) => {
  chrome.storage.local.get('auditLog', (result) => {
    const auditLog = result.auditLog || [];
    auditLog.unshift({ message, timestamp: Date.now() });
    if (auditLog.length > 50) {
      auditLog.pop();
    }
    chrome.storage.local.set({ auditLog }, () => {
      renderAuditLog(auditLog);
    });
  });
};

const hashPin = async (pin, salt) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + salt);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
};

chrome.storage.local.get(['whitelist', 'blacklist', 'auditLog', 'telemetryOptIn'], (result) => {
  const whitelist = result.whitelist || [];
  const blacklist = result.blacklist || [];
  const auditLog = result.auditLog || [];
  renderList(whitelist, whitelistEl, 'whitelist');
  renderList(blacklist, blacklistEl, 'blacklist');
  renderAuditLog(auditLog);
  telemetryOptInCheckbox.checked = result.telemetryOptIn || false;
});

whitelistForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const newItem = whitelistInput.value.trim();
  if (newItem) {
    chrome.storage.local.get('whitelist', (result) => {
      const whitelist = result.whitelist || [];
      whitelist.push(newItem);
      chrome.storage.local.set({ whitelist }, () => {
        renderList(whitelist, whitelistEl, 'whitelist');
        addToAuditLog(`Added "${newItem}" to whitelist`);
        whitelistInput.value = '';
      });
    });
  }
});

blacklistForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const newItem = blacklistInput.value.trim();
  if (newItem) {
    chrome.storage.local.get('blacklist', (result) => {
      const blacklist = result.blacklist || [];
      blacklist.push(newItem);
      chrome.storage.local.set({ blacklist }, () => {
        renderList(blacklist, blacklistEl, 'blacklist');
        addToAuditLog(`Added "${newItem}" to blacklist`);
        blacklistInput.value = '';
      });
    });
  }
});

clearLogButton.addEventListener('click', () => {
  chrome.storage.local.set({ auditLog: [] }, () => {
    renderAuditLog([]);
    addToAuditLog('Audit log cleared');
  });
});

pinForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const pin = pinInput.value;
  if (pin) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const saltString = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
    const hashedPin = await hashPin(pin, saltString);
    chrome.storage.local.set({ pin: { hash: hashedPin, salt: saltString } }, () => {
      addToAuditLog('PIN changed');
      pinInput.value = '';
    });
  }
});

telemetryOptInCheckbox.addEventListener('change', (e) => {
  const telemetryOptIn = e.target.checked;
  chrome.storage.local.set({ telemetryOptIn }, () => {
    addToAuditLog(`Telemetry opt-in changed to ${telemetryOptIn}`);
  });
});

clearDataButton.addEventListener('click', () => {
  if (confirm('Are you sure you want to clear all local data? This action cannot be undone.')) {
    chrome.storage.local.clear(() => {
      addToAuditLog('All local data cleared');
      location.reload();
    });
  }
});