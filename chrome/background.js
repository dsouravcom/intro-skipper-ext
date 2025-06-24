// Extension installation handler
chrome.runtime.onInstalled.addListener(handleInstallation);

// Message handler
chrome.runtime.onMessage.addListener(handleMessage);

async function handleInstallation() {
    try {
        const success = await initializeExtension();
        if (!success) {
            console.error("Intro Skipper: Failed to initialize");
        }
    } catch (error) {
        console.error("Intro Skipper: Installation error:", error);
    }
}

async function initializeExtension() {
    try {
        // Initialize with global enabled by default
        const existing = await chrome.storage.sync.get(["globalEnabled"]);

        const updates = {};

        if (existing.globalEnabled === undefined) {
            updates.globalEnabled = true;
        }

        if (Object.keys(updates).length > 0) {
            await chrome.storage.sync.set(updates);
        }

        return true;
    } catch (error) {
        console.error("Failed to initialize extension:", error);
        return false;
    }
}

function handleMessage(request, sender, sendResponse) {
    return false;
}
