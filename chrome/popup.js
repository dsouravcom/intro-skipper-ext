// DOM elements
let globalToggle;
let status;
let manageBtn;

// Initialize popup when DOM is ready
document.addEventListener("DOMContentLoaded", init);

async function init() {
    try {
        // Get DOM elements
        globalToggle = document.getElementById("globalToggle");
        status = document.getElementById("status");
        manageBtn = document.getElementById("manageBtn");

        await loadSettings();
        setupEventListeners();
    } catch (error) {
        console.error("Popup initialization failed:", error);
        showError("Failed to initialize popup");
    }
}

function setupEventListeners() {
    globalToggle.addEventListener("change", toggleGlobal);
    manageBtn.addEventListener("click", openManagePage);
}

async function loadSettings() {
    try {
        const result = await chrome.storage.sync.get(["globalEnabled"]);
        const globalEnabled = result.globalEnabled !== false;

        globalToggle.checked = globalEnabled;
        updateStatus(globalEnabled);
    } catch (error) {
        console.error("Error loading settings:", error);
        showError("Error loading settings");
    }
}

async function toggleGlobal(e) {
    const enabled = e.target.checked;

    try {
        await chrome.storage.sync.set({ globalEnabled: enabled });
        updateStatus(enabled);

        // Notify all content scripts
        await notifyContentScripts();
    } catch (error) {
        console.error("Error saving settings:", error);
        showError("Error saving settings");
        // Revert toggle on error
        globalToggle.checked = !enabled;
    }
}

async function notifyContentScripts() {
    try {
        const tabs = await chrome.tabs.query({});
        const notifications = tabs.map(
            (tab) =>
                chrome.tabs
                    .sendMessage(tab.id, { action: "updateSettings" })
                    .catch(() => {}) // Ignore errors for tabs without content script
        );
        await Promise.allSettled(notifications);
    } catch (error) {
        console.error("Error notifying content scripts:", error);
    }
}

function updateStatus(enabled) {
    status.textContent = enabled ? "Auto Skip: Enabled" : "Auto Skip: Disabled";
    status.className = enabled ? "status enabled" : "status disabled";
}

function showError(message) {
    status.textContent = message;
    status.className = "status disabled";
}

function openManagePage() {
    chrome.tabs.create({
        url: chrome.runtime.getURL("manage.html"),
    });
    window.close();
}
