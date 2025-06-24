// Firefox background script using browser API
// Extension installation handler
browser.runtime.onInstalled.addListener(handleInstallation);

// Message handler
browser.runtime.onMessage.addListener(handleMessage);

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
        const existing = await browser.storage.sync.get(["globalEnabled"]);

        const updates = {};

        if (existing.globalEnabled === undefined) {
            updates.globalEnabled = true;
        }

        if (Object.keys(updates).length > 0) {
            await browser.storage.sync.set(updates);
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
